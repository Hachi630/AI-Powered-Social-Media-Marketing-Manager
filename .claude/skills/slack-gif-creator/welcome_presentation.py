"""
Welcome Presentation GIF - Transparent background with cute character
"Welcome to our presentation! Let's review our project"
"""

import math
import sys
sys.path.insert(0, 'D:/React/Melo/.claude/skills/slack-gif-creator')

from PIL import Image, ImageDraw, ImageFont
import imageio

def draw_cute_star(draw, x, y, size, color, rotation=0):
    """Draw a cute rounded star"""
    points = []
    for i in range(10):
        angle = math.radians(i * 36 + rotation - 90)
        r = size if i % 2 == 0 else size * 0.4
        px = x + int(r * math.cos(angle))
        py = y + int(r * math.sin(angle))
        points.append((px, py))
    draw.polygon(points, fill=color)

def draw_cute_blob(draw, x, y, size, color, outline_color, squish=1.0, tilt=0):
    """Draw a cute blob/slime character"""
    # Main body - wobbly circle shape
    body_width = int(size * 1.1)
    body_height = int(size * 0.9 * squish)

    # Body
    body_bbox = [
        x - body_width // 2,
        y - body_height // 2,
        x + body_width // 2,
        y + body_height // 2
    ]
    draw.ellipse(body_bbox, fill=color, outline=outline_color, width=3)

    # Cute face - big sparkly eyes
    eye_size = size // 5
    eye_y = y - size // 10
    eye_spacing = size // 4

    # Left eye (white background)
    draw.ellipse([
        x - eye_spacing - eye_size,
        eye_y - eye_size,
        x - eye_spacing + eye_size,
        eye_y + eye_size
    ], fill=(255, 255, 255))

    # Right eye (white background)
    draw.ellipse([
        x + eye_spacing - eye_size,
        eye_y - eye_size,
        x + eye_spacing + eye_size,
        eye_y + eye_size
    ], fill=(255, 255, 255))

    # Pupils
    pupil_size = eye_size // 2
    pupil_offset_x = int(math.sin(tilt * 0.1) * 3)

    draw.ellipse([
        x - eye_spacing - pupil_size + pupil_offset_x,
        eye_y - pupil_size,
        x - eye_spacing + pupil_size + pupil_offset_x,
        eye_y + pupil_size
    ], fill=(50, 50, 80))

    draw.ellipse([
        x + eye_spacing - pupil_size + pupil_offset_x,
        eye_y - pupil_size,
        x + eye_spacing + pupil_size + pupil_offset_x,
        eye_y + pupil_size
    ], fill=(50, 50, 80))

    # Eye sparkles
    sparkle_size = pupil_size // 2
    draw.ellipse([
        x - eye_spacing - sparkle_size + 2,
        eye_y - pupil_size + 2,
        x - eye_spacing + sparkle_size + 2,
        eye_y - pupil_size + sparkle_size + 2
    ], fill=(255, 255, 255))

    draw.ellipse([
        x + eye_spacing - sparkle_size + 2,
        eye_y - pupil_size + 2,
        x + eye_spacing + sparkle_size + 2,
        eye_y - pupil_size + sparkle_size + 2
    ], fill=(255, 255, 255))

    # Blush cheeks
    blush_color = (255, 180, 200, 180)
    cheek_size = size // 6
    cheek_y = y + size // 8

    # Left cheek
    draw.ellipse([
        x - body_width // 2 + cheek_size,
        cheek_y - cheek_size // 2,
        x - body_width // 2 + cheek_size * 2 + 5,
        cheek_y + cheek_size // 2
    ], fill=(255, 180, 200))

    # Right cheek
    draw.ellipse([
        x + body_width // 2 - cheek_size * 2 - 5,
        cheek_y - cheek_size // 2,
        x + body_width // 2 - cheek_size,
        cheek_y + cheek_size // 2
    ], fill=(255, 180, 200))

    # Cute smile
    smile_y = y + size // 5
    smile_width = size // 4
    draw.arc([
        x - smile_width,
        smile_y - smile_width // 2,
        x + smile_width,
        smile_y + smile_width
    ], start=0, end=180, fill=(80, 60, 80), width=3)


def draw_sparkle(draw, x, y, size, color=(255, 255, 200)):
    """Draw a 4-point sparkle"""
    # Vertical line
    draw.line([(x, y - size), (x, y + size)], fill=color, width=2)
    # Horizontal line
    draw.line([(x - size, y), (x + size, y)], fill=color, width=2)
    # Small diagonals
    small = size // 2
    draw.line([(x - small, y - small), (x + small, y + small)], fill=color, width=1)
    draw.line([(x + small, y - small), (x - small, y + small)], fill=color, width=1)


def draw_cute_text(draw, text, position, font_size, text_color, outline_color, outline_width=3):
    """Draw text with cute bubble outline"""
    # Try to load a rounder/cuter font
    font = None
    font_paths = [
        "C:/Windows/Fonts/comic.ttf",  # Comic Sans (cute)
        "C:/Windows/Fonts/comicbd.ttf",  # Comic Sans Bold
        "C:/Windows/Fonts/segoeuib.ttf",  # Segoe UI Bold
        "C:/Windows/Fonts/arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]

    for path in font_paths:
        try:
            font = ImageFont.truetype(path, font_size)
            break
        except:
            continue

    if font is None:
        font = ImageFont.load_default()

    x, y = position

    # Draw thick outline for bubble effect
    for dx in range(-outline_width, outline_width + 1):
        for dy in range(-outline_width, outline_width + 1):
            if dx * dx + dy * dy <= outline_width * outline_width:
                draw.text((x + dx, y + dy), text, font=font, fill=outline_color, anchor="mm")

    # Draw main text
    draw.text((x, y), text, font=font, fill=text_color, anchor="mm")


def draw_floating_heart(draw, x, y, size, color):
    """Draw a cute heart"""
    # Two circles for top of heart
    r = size // 3
    draw.ellipse([x - r - r//2, y - r, x + r//2, y + r], fill=color)
    draw.ellipse([x - r//2, y - r, x + r + r//2, y + r], fill=color)
    # Triangle for bottom
    points = [
        (x - size//2 - 2, y),
        (x + size//2 + 2, y),
        (x, y + size)
    ]
    draw.polygon(points, fill=color)


def create_welcome_gif():
    """Create the welcome presentation GIF with transparent background"""
    width, height = 640, 400
    fps = 12
    num_frames = 36  # 3 seconds

    frames = []

    # Character colors - cute mint/teal blob
    blob_color = (150, 230, 210)  # Mint green
    blob_outline = (100, 180, 160)

    for i in range(num_frames):
        # Create frame with transparent background (RGBA)
        frame = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(frame)

        # Animation timing
        t = i / num_frames

        # Bounce animation
        bounce = 15 * abs(math.sin(t * math.pi * 3))
        squish = 1.0 - 0.1 * abs(math.cos(t * math.pi * 3))

        # Character position
        char_x = width // 2
        char_y = int(height // 2 + 30 - bounce)
        char_size = 100

        # Draw floating hearts
        heart_positions = [
            (char_x - 120, char_y - 40, (255, 150, 180)),
            (char_x + 130, char_y - 30, (255, 180, 200)),
            (char_x - 100, char_y + 50, (255, 200, 210)),
        ]

        for j, (hx, hy, hcolor) in enumerate(heart_positions):
            phase = (i + j * 5) % 18
            if phase < 12:
                float_offset = math.sin((i + j * 4) * 0.3) * 8
                heart_size = 12 + int(4 * math.sin(phase * math.pi / 12))
                draw_floating_heart(draw, hx, int(hy + float_offset), heart_size, hcolor)

        # Draw sparkles
        sparkle_positions = [
            (char_x - 140, char_y - 20),
            (char_x + 150, char_y - 10),
            (char_x - 80, char_y + 60),
            (char_x + 100, char_y + 50),
        ]

        for j, (sx, sy) in enumerate(sparkle_positions):
            sparkle_phase = (i + j * 6) % 15
            if sparkle_phase < 10:
                sparkle_size = 6 + int(4 * math.sin(sparkle_phase * math.pi / 10))
                # Sparkle color cycles
                colors = [(255, 230, 150), (200, 230, 255), (255, 200, 220)]
                draw_sparkle(draw, sx, sy, sparkle_size, colors[j % 3])

        # Draw the cute blob character
        draw_cute_blob(draw, char_x, char_y, char_size, blob_color, blob_outline,
                       squish=squish, tilt=i)

        # Draw waving arm/appendage
        wave_angle = math.sin(i * 0.5) * 0.4
        arm_x = char_x + int(char_size * 0.5)
        arm_y = char_y - int(char_size * 0.1)
        arm_end_x = arm_x + int(30 * math.cos(wave_angle + 0.5))
        arm_end_y = arm_y - int(30 * abs(math.sin(wave_angle + 0.5)))

        # Small waving blob arm
        arm_size = 20
        draw.ellipse([
            arm_end_x - arm_size // 2,
            arm_end_y - arm_size // 2,
            arm_end_x + arm_size // 2,
            arm_end_y + arm_size // 2
        ], fill=blob_color, outline=blob_outline, width=2)

        # Draw text with cute style
        text_bounce = 3 * math.sin(i * 0.25)

        # Top text - Welcome
        draw_cute_text(
            draw, "Welcome to our presentation!",
            position=(width // 2, 55 + text_bounce),
            font_size=34,
            text_color=(255, 255, 255),
            outline_color=(120, 100, 140),
            outline_width=4
        )

        # Bottom text
        draw_cute_text(
            draw, "Let's review our project",
            position=(width // 2, height - 50 - text_bounce),
            font_size=30,
            text_color=(255, 255, 255),
            outline_color=(120, 100, 140),
            outline_width=4
        )

        # Add small stars around text
        star_positions = [
            (80, 50), (width - 80, 55),
            (100, height - 45), (width - 100, height - 50)
        ]
        for j, (sx, sy) in enumerate(star_positions):
            star_phase = (i + j * 4) % 12
            star_size = 8 + int(4 * math.sin(star_phase * math.pi / 12))
            star_colors = [(255, 220, 100), (255, 180, 200), (180, 220, 255), (200, 255, 200)]
            draw_cute_star(draw, sx, sy, star_size, star_colors[j], rotation=i * 3)

        frames.append(frame)

    # Save as GIF with transparency
    output_path = 'D:/React/Melo/welcome_presentation.gif'

    # Convert frames to numpy arrays for imageio
    import numpy as np
    frame_arrays = [np.array(f) for f in frames]

    # Save with imageio (supports transparency)
    imageio.mimsave(
        output_path,
        frame_arrays,
        format='GIF',
        duration=1000 / fps,  # duration in ms
        loop=0  # infinite loop
    )

    # Get file size
    import os
    size_kb = os.path.getsize(output_path) / 1024

    print(f"GIF created successfully!")
    print(f"  Path: {output_path}")
    print(f"  Size: {size_kb:.1f} KB")
    print(f"  Frames: {num_frames}")
    print(f"  Duration: {num_frames / fps:.1f}s")

    return output_path


if __name__ == "__main__":
    create_welcome_gif()
