import sys

def get_gif_background_color(filename):
    try:
        with open(filename, 'rb') as f:
            header = f.read(6)
            if header not in (b'GIF87a', b'GIF89a'):
                print("Error: Not a GIF file")
                return
                
            lsd = f.read(7)
            packed_fields = lsd[4]
            bg_color_index = lsd[5]
            
            has_gct = (packed_fields & 0x80) != 0
            if not has_gct:
                print("Error: No Global Color Table found")
                return
                
            gct_size = 2 ** ((packed_fields & 0x07) + 1)
            gct = f.read(3 * gct_size)
            
            r = gct[bg_color_index * 3]
            g = gct[bg_color_index * 3 + 1]
            b = gct[bg_color_index * 3 + 2]
            
            print(f"#{r:02X}{g:02X}{b:02X}")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        get_gif_background_color(sys.argv[1])
    else:
        print("Error: No filename provided")
