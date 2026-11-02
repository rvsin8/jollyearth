"""Authenticated same-origin HTTP audit only; never a browser interaction test.

Read a Sites-provided read token through non-echoing stdin, never argv or disk.
No redirects are followed, so the token cannot be forwarded to another origin.
"""
import concurrent.futures, datetime, hashlib, json, pathlib, sys, time
import urllib.request, urllib.error

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl): return None

origin = 'https://earthbound-field-atlas.rvsin8.chatgpt.site'
if sys.stdin.isatty():
    import termios
    settings = termios.tcgetattr(sys.stdin)
    hidden = settings.copy()
    hidden[3] &= ~termios.ECHO
    termios.tcsetattr(sys.stdin, termios.TCSANOW, hidden)
print('Ready for Site read token on stdin (input hidden).', flush=True)
token = json.loads(sys.stdin.readline())['token']
records = json.loads(pathlib.Path('public/data/animal-exhibits.json').read_text())
slugs = ['gopher-tortoise', 'green-sea-turtle', 'ring-tailed-lemur', 'bornean-orangutan', 'red-fox']
paths = ['/?intro=0&exhibit=' + s for s in slugs] + ['/at-risk', '/data/animal-exhibits.json', '/data/models.json']
for animal in records:
    if animal['slug'] in slugs:
        paths += [animal['illustration'], animal['model']['file'], animal['model']['mobileFile']]

def probe(path):
    started = time.perf_counter()
    try:
        req = urllib.request.Request(origin + path, headers={'OAI-Sites-Authorization': 'Bearer ' + token})
        try: r = urllib.request.build_opener(NoRedirect).open(req, timeout=40)
        except urllib.error.HTTPError as e: r = e
        content = r.read()
        result = {'path': path, 'status': r.code, 'contentType': r.headers.get('content-type'), 'bytes': len(content), 'requestMs': round((time.perf_counter()-started)*1000)}
        if r.code == 200:
            local = pathlib.Path('public' + path)
            if '?' not in path and local.is_file():
                result['sha256'] = hashlib.sha256(content).hexdigest()
                result['matchesSource'] = content == local.read_bytes()
            if path.endswith('.glb'): result['glbMagic'] = content[:4] == b'glTF'
            if path.endswith('.json'):
                try: json.loads(content); result['validJson'] = True
                except ValueError: result['validJson'] = False
        return result
    except (OSError, urllib.error.URLError) as e:
        return {'path': path, 'error': type(e).__name__}

with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    results = list(pool.map(probe, dict.fromkeys(paths)))
report = {'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'origin': origin, 'verification': 'HTTP only; no JavaScript, WebGL, browser console or touch execution', 'results': results}
destination = pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'pipeline/reports/phase2-live-http.json')
destination.write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(report), flush=True)
