import pathlib
code = pathlib.Path('..\\receiver.js').read_text()
positions = []
start = -1
while True:
    start = code.find('fetch(', start + 1)
    if start == -1:
        break
    positions.append(start)
print('found', len(positions), 'fetch calls')
for pos in positions[:6]:
    snippet = code[pos:pos+200]
    print('\n---\n', snippet)