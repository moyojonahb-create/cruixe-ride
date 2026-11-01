from pathlib import Path
from PIL import Image,ImageDraw
ui=Path('nonproduction/approved-ride-ui')
a=Image.open('C:/Users/MUSAE/Pictures/cruize-ride-approved-ui.png').convert('RGB')
b=Image.open(ui/'qa-edge/reference-viewport.png').convert('RGB')
print('Source dimensions:',a.size,'Edge viewport:',b.size)
a=a.resize(b.size,Image.Resampling.LANCZOS)
board=Image.new('RGB',(b.width*2+24,b.height+28),'#eeeeee')
board.paste(a,(0,28));board.paste(b,(b.width+24,28))
d=ImageDraw.Draw(board);d.text((8,8),'Approved reference (scaled)',fill='#111');d.text((b.width+32,8),'Actual Edge /ride 390 x 694',fill='#111')
board.save(ui/'qa-edge/reference-comparison.png')
# Focus on the lower 260 CSS pixels, preserving both images at the same scale.
board.crop((0,b.height-260+28,board.width,board.height)).save(ui/'qa-edge/sheet-comparison.png')
