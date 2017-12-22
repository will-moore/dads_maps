
# Read big images and split them into tiles

from PIL import Image
import os

src_folder = "images/scansMidNorfolk"
# tile_folder = "images/tiles"
tile_folder = src_folder
# image name is long,lat,cols,rows
# img_name = "616000,314000,7,6.png"
img_name = "606000,328000,4,8.png"

coords = img_name.replace(".png", "").split(",")
coords = [int(c) for c in coords]
lon = coords[0]
lat = coords[1]
cols = coords[2]
rows = coords[3]


print "Cols", cols
print "Rows", rows

image = Image.open(os.path.join(src_folder, img_name))

size = image.size
tile_w = size[0]/cols
tile_h = size[1]/rows
print size, tile_w, tile_h


for col in range(cols):
	for row in range(rows):

		# crop and save...
		# grid coordinates start in BOTTOM left corner
		left = int(float(col) * size[0] / cols)
		upper = int(float(rows - row - 1) * size[1] / rows)
		right = left + tile_w
		bottom = upper + tile_h
		print "col, row", col, row
		print "   left, upper, right, bottom", left, upper, right, bottom
		tile = image.crop((left, upper, right, bottom))

		tile_lon = lon + (2000 * col)
		tile_lat = lat + (2000 * row)
		tile_name = "%s,%s.png" % (tile_lon, tile_lat)
		print tile_name
		tile.save(os.path.join(tile_folder, tile_name))
