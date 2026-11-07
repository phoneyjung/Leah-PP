# G4 M5: builds the fixed door list qa/g4/m5-doors.json from the m5_pick.js output (v2 after Codex T34).
#   python3 qa/g4/m5_build.py <m5_pick output.json> qa/g4/m5-doors.json
# v2: a 1-tile passage is used only when the game's own path from 3 tiles before to 3 tiles after walks THROUGH the tile
# (m5_pick 'passes'; T34-N1: the old N06 farm (1,4) went round it) and every narrow walk step carries via:[x,y], which replay.js
# checks again on the real run · X03 = leave the house after entering it from capital (stay:true, no goMap) — the same door as X06
# but a different "came from" (S.homeFrom), so both contexts of the room door are covered.
import json, sys

R = json.load(open(sys.argv[1]))
EX = [('capital', 'n', 'town square → north road to the cave mouth'),
      ('capital', 'home', 'house door in town (the kid walks under the house front: head vs roof/door frame)'),
      ('room', 'door', 'leave the house after entering it from capital (stay on the map X02 ended on) → back to capital', True),
      ('capital', 'w', 'LOCKED gate to the farm: the kid must be pushed back, no map change'),
      ('farm', 'e', 'farm → town gate (the spawn side of the farm)'),
      ('farm', 'home', 'farmhouse door (head vs roof/door frame)'),
      ('room', 'door', 'inside the house → out again; after X06 (farm home) the game sends the kid back to the farm (S.homeFrom), not to capital'),
      ('room2', 'down', 'upstairs → downstairs (stairs exit inside a house)'),
      ('room3', 'down', 'top floor → middle floor (second stairs exit)'),
      ('royal', 'n', 'royal grounds → cave mouth'),
      ('royal', 's', 'royal grounds → town'),
      ('cavemouth', 's', 'dark cave mouth → town (lantern held while walking out)'),
      ('town2', 'n', 'second town → cave mouth'),
      ('town2', 'w', 'second town → farm'),
      ('town2', 'e', 'second town → east road (the game sends it to capital: redirect kept as is)'),
      ('town2', 's', 'second town south gate: the exit tile sits next to a 1-tile passage (the game sends it to capital)')]
cases = []
xn = 0
for row in EX:
    mid, eid, why = row[:3]
    stay = len(row) > 3 and row[3]
    e = next(x for x in R['maps'][mid]['exits'] if x['id'] == eid)
    xn += 1
    if stay:
        cid = 'X%02d-room-door-from-capital' % xn
        steps = [{'s': 0.4}, {'exit': eid, 's': 1.0}, {'s': 2.0}]   # from where X02 left the kid (just inside the room door)
    else:
        cid = 'X%02d-%s-%s' % (xn, mid, eid)
        st = e['start']
        steps = [{'at': st[:2], 's': 0.4}, {'exit': eid, 's': 1.0}, {'s': 2.0}]
    c = {'id': cid, 'kind': 'exit', 'map': mid, 'exit': eid, 'to': e['to'], 'locked': e['locked'], 'exitTile': e['tile'], 'why': why, 'steps': steps}
    if stay: c['stay'] = True
    else: c['start'] = e['start'][:2]
    cases.append(c)
NAR = {'capital': (2, 'between town buildings: roofs and walls on both sides'), 'town2': (2, 'between houses in the second town'),
       'farm': (2, 'gaps in the farm fences'), 'room': (1, 'between furniture inside the house')}
nn = 0
for mid, (n, why) in NAR.items():
    cells = sorted([c for c in R['maps'][mid]['cells'] if c['cross'] and c.get('passes')], key=lambda c: (not c['nearExit'], c['y'], c['x']))
    picked = []
    for c in cells:
        if any(abs(c['x'] - p['x']) + abs(c['y'] - p['y']) < 6 for p in picked): continue
        picked.append(c)
        if len(picked) == n: break
    assert len(picked) == n, (mid, len(picked))
    for c in picked:
        nn += 1
        a, b = c['cross']; d = [b[0] - a[0], b[1] - a[1]]
        cases.append({'id': 'N%02d-%s-%d-%d' % (nn, mid, c['x'], c['y']), 'kind': 'narrow', 'map': mid, 'cell': [c['x'], c['y']], 'dir': c['dir'], 'nearExit': c['nearExit'],
                      'start': a, 'end': b, 'why': why + (' · next to an exit' if c['nearExit'] else ''),
                      'steps': [{'at': a, 's': 0.4}, {'walk': d, 'via': [c['x'], c['y']], 's': 1.0}, {'s': 1.6}]})
reach = [m for m, v in R['maps'].items() if 'error' not in v]
doc = {'version': 'G4.0 v2 · 6 Nov 2569 (after Codex T34 N1)', 'base': 'main eb60c65 (game 2.33 new world)',
       'source': 'qa/g4/m5_pick.js on main: %d map ids, %d reachable (%s; the old-world ids land on capital), 1-tile passages by the SOLID rule = %d in %d maps (the G0 count 518 in 26/32 maps was made before the new world closed the old maps)'
                 % (R['mapCount'], len(reach), ' '.join(reach), R['narrowTotal'], R['mapsWithNarrow']),
       'rule': 'every case runs at zoom 75 % and 100 % (ZOOM=0.75 / ZOOM=1) through qa/g4/replay.js SCEN=m5-doors.json · 3 checkpoints per case · a narrow walk fails the run if its path does not cross the passage tile · pass (G4.2): map after = flag off, camera 0 px, canvas + screenshot 0 px with the flag off, draw log (y-sort order) equal',
       'counts': {'exits': sum(c['kind'] == 'exit' for c in cases), 'exitMaps': len({c['map'] for c in cases if c['kind'] == 'exit'}),
                  'narrow': sum(c['kind'] == 'narrow' for c in cases), 'narrowMaps': len(NAR), 'checkpoints': sum(len(c['steps']) for c in cases)},
       'notCovered': 'hunt1 (its ground image is decoded in a Worker the virtual clock does not hold) · stairs up (an action, not an exit)',
       'cases': cases}
json.dump(doc, open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
print(doc['counts'])
for c in cases: print(c['id'], c.get('to', ''), c.get('start', 'stay'))
