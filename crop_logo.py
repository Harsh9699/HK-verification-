from PIL import Image

def crop_transparent(img_path):
    img = Image.open(img_path).convert("RGBA")
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        img.save(img_path, "PNG")
        print("Cropped successfully! Bounding box was:", bbox)
    else:
        print("Could not crop.")

if __name__ == '__main__':
    crop_transparent("logo_transparent.png")
