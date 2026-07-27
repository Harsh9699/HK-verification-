from PIL import Image

def remove_bg():
    img = Image.open("logo.png").convert("RGBA")
    datas = img.getdata()

    newData = []
    # The background is light gray/white. We make light pixels transparent.
    for item in datas:
        # Check if the pixel is close to white
        if item[0] > 235 and item[1] > 235 and item[2] > 235:
            newData.append((255, 255, 255, 0))
        else:
            # Make the logo pure black to be safe, keeping alpha
            newData.append((20, 20, 20, 255))

    img.putdata(newData)
    img.save("logo_transparent.png", "PNG")
    print("Background removed and saved as logo_transparent.png")

if __name__ == '__main__':
    remove_bg()
