# Earthbound — species model fidelity specs

Reference for building, buying or reviewing the 3D model behind each animal exhibit. Store each entry in the species registry under `fidelity`. Items marked ● are hard requirements: a model that misses one is rejected, however good it looks otherwise.

## Rules for every species

- **Real animal, real scale.** Metres, +Y up, facing +Z, origin on the ground between the feet. No primitive-shape bodies, no stylised or cartoon models, no toy scans.
- **Adult, wild-type colouring** unless the entry says otherwise. One locality or morph per species, kept consistent with its illustration.
- **Matte, true-colour materials.** Fur, feathers and skin are rough. Gloss only on eyes, noses, wet skin, beaks and shells where the entry says so.
- **Clips are in place** (no root motion), loop cleanly, and use canonical names: `Idle`, `Walk`, `Trot`, `Run`, `Sit`, `Pounce`, `Swim`, `Fly`, `Glide`, `Climb`, `Perch`. Use only the clips that fit the animal.
- **Budget:** desktop GLB ≤ 60k triangles, 2048 px textures, ≤ 8 MB. Mobile GLB ≤ 20k triangles, 1024 px textures, ≤ 3 MB.
- **Scale check:** the validator compares the model's measured length with `fidelity.scale` and fails anything outside the range.

---

## Red fox — *Vulpes vulpes* (pilot)

- **Scale:** head and body 0.45–0.90 m (target 0.65), tail 0.30–0.55 m (target 0.40), weight 3–14 kg. The tail can reach about 70% of head-and-body length. Nose to tail tip is about 1.0–1.1 m for a New Jersey adult. The validator measures this length: target 1.05 m, with anything from 0.75 to 1.45 m accepted.
- **Build:** slender, deep-chested, long-legged; the elbow sits about halfway up the leg. Narrow skull, long narrow muzzle. Small, compact, oval paws, and it walks on its toes.
- ● **Ears:** tall and pointed. Backs are black and insides white-furred.
- ● **Eyes:** amber, slanted, with vertical slit pupils.
- ● **Muzzle:** black nose and lip line, white upper lip and cheeks.
- ● **Bib:** white chin, throat and chest. The belly is white to ash-grey.
- ● **Legs:** black "stockings" on the lower legs, highest on the front of the forelegs. Hind legs are black from the hock down.
- ● **Tail tip:** white. A black tip reads as a grey fox.
- **Details that sell it:** a grizzled back saddle (guard hairs with pale tips), a dark spot on top of the tail near its base (the supracaudal gland), stiff carpal whiskers at the back of each wrist, and mystacial whiskers.
- **Fur flow:** nose → tail along the back, downward on the flanks and legs, back and out on the cheek ruff. Alpha-tested fur cards on the silhouette (ruff, chest, belly, tail) over a textured body.
- **Clips:**
  - `Idle`: breathing, ears swivelling independently, tail hanging low.
  - `Walk`
  - `Trot`: the main travelling gait. The back stays level and the head low. The hind paw lands in the fore print, so the trail is nearly straight.
  - `Run`: a gallop, with the tail streamed out for balance.
  - `Sit`: haunches down, forelegs straight, tail around the feet.
  - `Pounce`: freeze, ears forward, head tilted to listen, crouch, a high arcing leap, and the forepaws driving straight down. It plays once and returns to `Idle`.
- **Common misses:**
  - Small-dog proportions.
  - Round pupils.
  - Orange legs with black only on the paws.
  - A tail that is a smooth cone or a thin cat tail.
  - A bouncy dog walk, or a wagging tail.

---

The entries below cover species already on the site. Sizes are approximate and need checking against a source before they go into `fidelity.scale`.

### Panther chameleon — *Furcifer pardalis*
- ● Feet are zygodactyl: toes fused into two opposing bundles on each foot, never five separate toes.
- ● Turret eyes that move independently.
- ● A prehensile tail that coils.
- ● A low casque. The tall helmet belongs to the veiled chameleon.
- Males have a pale lateral stripe. Colour varies by locality, so pick one (for example Ambilobe or Nosy Be) and match the illustration.
- **Clips:** `Idle` (slow eye roving, colour unchanged), `Walk` (a halting, rocking "leaf-sway" step).
- **Misses:** a generic lizard body, or a tail that drags straight.

### Ring-tailed lemur — *Lemur catta*
- ● A long, bushy tail banded in alternating black and white rings, ending black. It is not prehensile.
- ● A white face with black triangular eye patches, amber eyes, and a dark, narrow, fox-like muzzle.
- Grey back and limbs, white underside. Hands have nails, not claws.
- **Clips:** `Idle`, `Walk` (on all fours, tail raised high in a vertical curve), `Sit`.
- **Misses:** a monkey face, a tail that touches the back, or rings that don't wrap fully around the tail.

### Tomato frog — *Dyscophus antongilii*
- ● A round, plump body with smooth skin and a red-orange back. Females are larger and redder.
- ● No toe pads. This is a ground-dwelling burrower.
- A paler belly. It inflates its body when threatened.
- **Clips:** `Idle` (throat pulsing), `Walk` (a short crawl-hop).
- **Misses:** tree-frog discs on the toes, or warty toad skin.

### Madagascar giant day gecko — *Phelsuma grandis*
- ● Bright green with red markings: a stripe from nostril to eye and spots on the back.
- ● Round pupils. It is active by day; vertical pupils belong to night geckos.
- ● Widened toe pads with lamellae, and no movable eyelids.
- **Clips:** `Idle` (head bob, occasional eye-lick), `Climb`.
- **Misses:** slit pupils, eyelids, or a dull olive colour.

### Comet moth — *Argema mittrei*
- ● Yellow wings, each with a single eyespot.
- ● Very long hindwing tails, longer in males, that trail and twist in flight.
- Males have feathery antennae. Adults have no working mouthparts.
- **Clips:** `Idle` (wings slowly opening and closing on a perch), `Fly` (slow beats with the tails trailing).
- **Misses:** butterfly antennae with clubbed tips, or stiff tails that don't move.

### Great hornbill — *Buceros bicornis*
- ● A huge yellow bill topped by a yellow-and-black, U-shaped casque.
- ● A black face, and a white neck often stained yellow by preen oil.
- Black wings with white bands. A white tail with a black band.
- Eye colour differs by sex: red in males, bluish-white in females. Pick one and match the illustration.
- **Clips:** `Perch`, `Fly` (heavy, loud wingbeats), `Glide`.
- **Misses:** a toucan bill, or no casque.

### Green sea turtle — *Chelonia mydas*
- ● A short, rounded snout with a single pair of prefrontal scales between the eyes.
- ● A smooth carapace whose scutes sit edge to edge without overlapping, with four pairs of costal scutes.
- One claw on each flipper. The carapace is olive to brown; the name comes from green body fat, not shell colour.
- **Clips:** `Swim` (both front flippers stroking together like wings), `Idle` (slow hover).
- **Misses:** a hawksbill beak, overlapping scutes, or a bright green shell.

### Gopher tortoise — *Gopherus polyphemus*
- ● Flattened, shovel-like front legs covered in heavy scales, built for digging.
- ● Stumpy, elephantine hind feet.
- A domed brown-grey carapace. The front of the plastron projects forward.
- **Clips:** `Idle`, `Walk` (slow and high-stepping).
- **Misses:** turtle flippers, or webbed feet.

### Vaquita — *Phocoena sinus*
- ● A porpoise shape: no beak, and a rounded head.
- ● Dark rings around the eyes and dark lip patches.
- ● A tall, triangular dorsal fin. A curved dolphin fin is wrong.
- Grey back fading to pale sides. About 1.5 m long, the smallest cetacean.
- **Clips:** `Swim`.
- **Misses:** a dolphin beak, a falcate fin, or a smiling dolphin face.

### Javan rhinoceros — *Rhinoceros sondaicus*
- ● One horn. It is small in males, and females may have only a knob.
- ● Deep skin folds that look like armour plates, with a mosaic, scale-like skin texture.
- A pointed, prehensile upper lip. Grey.
- **Clips:** `Idle`, `Walk`.
- **Misses:** two horns, or the large raised bumps (tubercles) of the Indian rhino.

### Sumatran rhinoceros — *Dicerorhinus sumatrensis*
- ● Two horns, the front one longer.
- ● A coat of reddish-brown hair, especially on young animals, and fringed ears.
- The smallest living rhino.
- **Clips:** `Idle`, `Walk`.
- **Misses:** hairless grey skin, or one horn.

### Amur leopard — *Panthera pardus orientalis*
- ● A long, thick, pale cream winter coat.
- ● Large, widely spaced rosettes with thick black rims and no spots inside them. Spots inside rosettes are a jaguar.
- A long, heavy tail.
- **Clips:** `Idle`, `Walk`, `Run`, `Sit`.
- **Misses:** a short, tawny tropical coat, or a jaguar pattern.

### Saola — *Pseudoryx nghetinhensis*
- ● Two long, nearly straight, parallel horns sweeping back.
- ● White markings on the face, and large scent glands on the muzzle.
- A chocolate-brown coat.
- **Clips:** `Idle`, `Walk`.
- **Misses:** curved antelope horns, or a deer face.

### Kākāpō — *Strigops habroptilus*
- ● A flightless, heavy parrot with moss-green plumage mottled in yellow and black.
- ● An owl-like facial disc with whisker-like feathers around the bill.
- Short wings, strong legs, and a ground-walking stance.
- **Clips:** `Idle`, `Walk`, `Climb`.
- **Misses:** a flying-parrot posture, or bright parrot colours.

### Philippine eagle — *Pithecophaga jefferyi*
- ● A shaggy crest of long brown and cream feathers.
- ● A deep, high-arched, blue-grey bill, and blue-grey eyes.
- White underparts, brown back, large yellow feet.
- **Clips:** `Perch`, `Fly`, `Glide`.
- **Misses:** a smooth head, or a yellow bill.

### Hawksbill turtle — *Eretmochelys imbricata*
- ● A narrow, pointed, hawk-like beak.
- ● Overlapping scutes and a serrated rear edge to the carapace.
- Two pairs of prefrontal scales and two claws on each flipper. Amber tortoiseshell pattern.
- **Clips:** `Swim`, `Idle`.
- **Misses:** a green turtle's rounded snout, or smooth scutes.

### Axolotl — *Ambystoma mexicanum*
- ● Three pairs of feathery external gills.
- ● Wild-type colouring: dark olive-brown and mottled. The pink pet morph is not the wild animal.
- A wide head, small lidless eyes, and a fin running from the head to the tail tip.
- **Clips:** `Idle` (gills flaring), `Swim`, `Walk` (on the lake bed).
- **Misses:** pink colouring, or gills shaped like spikes.

### Hainan gibbon — *Nomascus hainanus*
- ● No tail, and very long arms.
- ● The sexes look different: adult males are black with a small crest, and adult females are golden-buff with a black crown.
- **Clips:** `Idle`, `Climb` (brachiating arm over arm).
- **Misses:** a tail, or monkey proportions.

### Bornean orangutan — *Pongo pygmaeus*
- ● Long, coarse, red-brown hair.
- ● Arms much longer than the legs, with hook-like hands and feet.
- Adult males have cheek flanges and a throat sac; match the illustration's sex.
- **Clips:** `Idle`, `Climb`, `Walk` (fist-walking on the ground).
- **Misses:** chimp proportions, or short hair.

### California condor — *Gymnogyps californianus*
- ● A bare head and neck: pink-orange in adults, dark grey in juveniles.
- ● Large white triangles on the undersides of the wings.
- A black ruff around the neck. Wingspan about 2.9 m. Leave out the field wing-tags.
- **Clips:** `Perch`, `Glide` (wings flat, primaries spread like fingers), `Fly`.
- **Misses:** turkey-vulture proportions, or white on the upper wing only.
