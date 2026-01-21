"""
Kirby Welcome GIF - "Welcome to our presentation! Let's review our project"
A cute bouncing Kirby character waving with welcome text
"""

import math
import sys
sys.path.insert(0, 'D:/React/Melo/.claude/skills/slack-gif-creator')

from PIL import Image, ImageDraw, ImageFont
from core.gif_builder import GIFBuilder
from core.easing import interpolate

def draw_kirby(draw, x, y, size, wave_angle=0, squish=1.0):
    """Draw a cute Kirby character"""
    # Body (pink circle with squish for bounce effect)
    body_width = size
    body_height = int(size * squish)
    body_y_offset = int(size * (1 - squish) / 2)

    # Main body - pink
    pink = (255, 182, 193)
    dark_pink = (255, 105, 180)

    body_bbox = [
        x - body_width // 2,
        y - body_height // 2 + body_y_offset,
        x + body_width // 2,
        y + body_height // 2 + body_y_offset
    ]
    draw.ellipse(body_bbox, fill=pink, outline=dark_pink, width=2)

    # Feet (red ovals at bottom)
    red = (220, 20, 60)
    dark_red = (178, 34, 34)
    foot_size = size // 4
    foot_y = y + body_height // 2 - foot_size // 3 + body_y_offset

    # Left foot
    draw.ellipse([
        x - body_width // 3 - foot_size // 2,
        foot_y,
        x - body_width // 3 + foot_size // 2,
        foot_y + foot_size
    ], fill=red, outline=dark_red, width=1)

    # Right foot
    draw.ellipse([
        x + body_width // 3 - foot_size // 2,
        foot_y,
        x + body_width // 3 + foot_size // 2,
        foot_y + foot_size
    ], fill=red, outline=dark_red, width=1)

    # Eyes (oval shaped with shine)
    eye_size_w = size // 6
    eye_size_h = size // 4
    eye_y = y - size // 8 + body_y_offset
    eye_spacing = size // 5

    # Left eye
    draw.ellipse([
        x - eye_spacing - eye_size_w,
        eye_y - eye_size_h // 2,
        x - eye_spacing + eye_size_w,
        eye_y + eye_size_h // 2
    ], fill=(0, 0, 80))

    # Right eye
    draw.ellipse([
        x + eye_spacing - eye_size_w,
        eye_y - eye_size_h // 2,
        x + eye_spacing + eye_size_w,
        eye_y + eye_size_h // 2
    ], fill=(0, 0, 80))

    # Eye shine (white dots)
    shine_size = size // 16
    draw.ellipse([
        x - eye_spacing - shine_size,
        eye_y - eye_size_h // 4 - shine_size,
        x - eye_spacing + shine_size,
        eye_y - eye_size_h // 4 + shine_size
    ], fill=(255, 255, 255))

    draw.ellipse([
        x + eye_spacing - shine_size,
        eye_y - eye_size_h // 4 - shine_size,
        x + eye_spacing + shine_size,
        eye_y - eye_size_h // 4 + shine_size
    ], fill=(255, 255, 255))

    # Cheeks (blush circles)
    blush = (255, 130, 171)
    cheek_size = size // 8
    cheek_y = y + size // 10 + body_y_offset

    draw.ellipse([
        x - body_width // 2 + cheek_size // 2,
        cheek_y - cheek_size // 2,
        x - body_width // 2 + cheek_size * 2,
        cheek_y + cheek_size // 2
    ], fill=blush)

    draw.ellipse([
        x + body_width // 2 - cheek_size * 2,
        cheek_y - cheek_size // 2,
        x + body_width // 2 - cheek_size // 2,
        cheek_y + cheek_size // 2
    ], fill=blush)

    # Mouth (happy curved line)
    mouth_y = y + size // 6 + body_y_offset
    mouth_width = size // 5
    draw.arc([
        x - mouth_width,
        mouth_y - mouth_width // 2,
        x + mouth_width,
        mouth_y + mouth_width
    ], start=0, end=180, fill=(0, 0, 80), width=2)

    # Waving arm (right side)
    arm_x = x + body_width // 2 - size // 10
    arm_y = y - size // 6 + body_y_offset
    arm_length = size // 2

    # Calculate arm end position based on wave angle
    wave_rad = math.radians(wave_angle)
    arm_end_x = arm_x + int(arm_length * math.cos(wave_rad))
    arm_end_y = arm_y - int(arm_length * abs(math.sin(wave_rad)))

    # Draw arm (pink oval/stub)
    arm_size = size // 5
    draw.ellipse([
        arm_end_x - arm_size // 2,
        arm_end_y - arm_size // 2,
        arm_end_x + arm_size // 2,
        arm_end_y + arm_size // 2
    ], fill=pink, outline=dark_pink, width=1)


def draw_text_with_outline(draw, text, position, font_size, text_color, outline_color, outline_width=2):
    """Draw text with outline for better visibility"""
    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except:
            font = ImageFont.load_default()

    x, y = position

    # Draw outline
    for dx in range(-outline_width, outline_width + 1):
        for dy in range(-outline_width, outline_width + 1):
            if dx != 0 or dy != 0:
                draw.text((x + dx, y + dy), text, font=font, fill=outline_color, anchor="mm")

    # Draw main text
    draw.text((x, y), text, font=font, fill=text_color, anchor="mm")


def draw_sparkle(draw, x, y, size, rotation=0):
    """Draw a sparkle/star"""
    points = []
    for i in range(8):
        angle = math.radians(i * 45 + rotation)
        r = size if i % 2 == 0 else size // 3
        px = x + int(r * math.cos(angle))
        py = y + int(r * math.sin(angle))
        points.append((px, py))

    draw.polygon(points, fill=(255, 255, 200), outline=(255, 215, 0))


def create_kirby_welcome_gif():
    """Create the Kirby welcome GIF"""
    width, height = 640, 400
    fps = 15
    num_frames = 45  # 3 seconds

    builder = GIFBuilder(width=width, height=height, fps=fps)

    # Colors
    bg_gradient_top = (135, 206, 250)  # Light sky blue
    bg_gradient_bottom = (176, 224, 230)  # Powder blue

    for i in range(num_frames):
        # Create frame with gradient background
        frame = Image.new('RGB', (width, height))
        draw = ImageDraw.Draw(frame)

        # Draw gradient background
        for y in range(height):
            ratio = y / height
            r = int(bg_gradient_top[0] * (1 - ratio) + bg_gradient_bottom[0] * ratio)
            g = int(bg_gradient_top[1] * (1 - ratio) + bg_gradient_bottom[1] * ratio)
            b = int(bg_gradient_top[2] * (1 - ratio) + bg_gradient_bottom[2] * ratio)
            draw.line([(0, y), (width, y)], fill=(r, g, b))

        # Calculate bounce (using sine wave for smooth bounce)
        bounce_cycle = (i / num_frames) * 3  # 3 bounces during animation
        bounce_height = 20 * abs(math.sin(bounce_cycle * math.pi))

        # Calculate squish (compress when landing)
        bounce_phase = (bounce_cycle * math.pi) % math.pi
        if bounce_phase < 0.3 or bounce_phase > 2.84:
            squish = 0.85  # Squished when landing
        else:
            squish = 1.0

        # Calculate wave angle (waving motion)
        wave_angle = 30 + 40 * math.sin(i * 0.4)  # Wave between 30-70 degrees

        # Kirby position
        kirby_x = width // 2
        kirby_y = int(height // 2 + 40 - bounce_height)
        kirby_size = 120

        # Draw sparkles around Kirby
        sparkle_positions = [
            (kirby_x - 100, kirby_y - 60),
            (kirby_x + 100, kirby_y - 50),
            (kirby_x - 80, kirby_y + 30),
            (kirby_x + 90, kirby_y + 20),
        ]

        for j, (sx, sy) in enumerate(sparkle_positions):
            # Sparkles appear and disappear with offset timing
            sparkle_phase = (i + j * 8) % 20
            if sparkle_phase < 12:
                sparkle_size = int(8 + 6 * math.sin(sparkle_phase * math.pi / 12))
                draw_sparkle(draw, sx, sy, sparkle_size, rotation=i * 5 + j * 45)

        # Draw Kirby
        draw_kirby(draw, kirby_x, kirby_y, kirby_size, wave_angle=wave_angle, squish=squish)

        # Draw text - Line 1 (Welcome)
        text1 = "Welcome to our presentation!"
        text1_y = 50
        # Subtle bounce for text
        text_bounce = 3 * math.sin(i * 0.3)

        draw_text_with_outline(
            draw, text1,
            position=(width // 2, text1_y + text_bounce),
            font_size=32,
            text_color=(255, 255, 255),
            outline_color=(70, 130, 180),
            outline_width=3
        )

        # Draw text - Line 2 (Let's review)
        text2 = "Let's review our project"
        text2_y = height - 45

        draw_text_with_outline(
            draw, text2,
            position=(width // 2, text2_y - text_bounce),
            font_size=28,
            text_color=(255, 255, 255),
            outline_color=(70, 130, 180),
            outline_width=3
        )

        builder.add_frame(frame)

    # Save the GIF
    output_path = 'D:/React/Melo/kirby_welcome.gif'
    info = builder.save(output_path, num_colors=128, optimize_for_emoji=False)

    print(f"GIF created successfully!")
    print(f"  Path: {output_path}")
    print(f"  Size: {info['size_kb']:.1f} KB")
    print(f"  Frames: {info['frame_count']}")
    print(f"  Duration: {info['duration_seconds']:.1f}s")

    return output_path


if __name__ == "__main__":
    create_kirby_welcome_gif()
