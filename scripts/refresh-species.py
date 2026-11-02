"""Build-time GBIF refresh. Never request GBIF or IUCN from the browser.
A failed refresh preserves the last successful per-species snapshot.
Run manually before the build: python scripts/refresh-species.py
"""
import json,datetime,urllib.request,urllib.parse,concurrent.futures,pathlib,subprocess
root=pathlib.Path(__file__).resolve().parent.parent
seed=json.loads((root/'content/species-seed.json').read_text())
out=root/'public/data/species.json'
old={s['id']:s for s in json.loads(out.read_text()).get('species',[])} if out.exists() else {}
today=datetime.datetime.now(datetime.timezone.utc).date().isoformat()
def fetch(url):
 req=urllib.request.Request(url,headers={'User-Agent':'EarthboundEducationalAtlas/1.0'})
 with urllib.request.urlopen(req,timeout=35) as r:
  if r.status==204:return None
  return json.load(r)
def refresh(s):
 try:
  matchurl='https://api.gbif.org/v1/species/match?name='+urllib.parse.quote(s['scientific'])
  match=fetch(matchurl)
  if match.get('matchType')!='EXACT' or match.get('rank')!='SPECIES':raise ValueError('No exact species match')
  key=match.get('acceptedUsageKey',match['usageKey'])
  url=f'https://api.gbif.org/v1/species/{key}/iucnRedListCategory'
  risk=fetch(url)
  code=risk.get('code','UNKNOWN') if risk else 'UNKNOWN'
  if code not in ['LC','NT','VU','EN','CR','EW','EX','DD','NE','UNKNOWN']:raise ValueError('Unrecognized IUCN category')
  raw={'retrieved':today,'matchUrl':matchurl,'match':match,'categoryUrl':url,'category':risk}
  (root/'content/cache'/f"{s['id']}.json").write_text(json.dumps(raw,indent=2)+'\n')
  s.update(status=code,dataAsOf=today,statusSource=url,stale=False)
  s['sources']=[x for x in s['sources'] if x.get('id')!='gbif-status']+[{'id':'gbif-status','title':'GBIF · cached global IUCN category','url':url,'accessed':today,'note':'Global category as returned by GBIF. Retrieval date is not assessment date.'}]
  print(s['id'],code,flush=True)
  return s
 except Exception as e:
  if s['id'] in old:
   prior=old[s['id']];prior['stale']=True;print(s['id'],'cached fallback',str(e),flush=True);return prior
  s.update(status='UNKNOWN',dataAsOf=today,statusSource='https://techdocs.gbif.org/en/openapi/v1/species',stale=True)
  print(s['id'],'no category available',str(e),flush=True);return s
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:records=list(pool.map(refresh,seed))
out.write_text(json.dumps({'refreshedAt':today,'refreshFailed':any(s['stale'] for s in records),'species':records},indent=2)+'\n')

# Reapply manually verified manifest records after a legacy GBIF refresh.
subprocess.run(['node',str(root/'scripts/compile-reviewed-species.mjs')],cwd=root,check=True)
