from PIL import Image, ImageDraw, ImageFont
import os

def render_frame(title, subtitle, wallet_status, network_id, counter_val, tx_hash, status_msg, step_text):
    width = 960
    height = 580
    bg_color = (9, 11, 16)
    card_bg = (18, 22, 33)
    header_bg = (12, 14, 20)
    terminal_bg = (6, 8, 12)
    text_color = (240, 244, 253)
    dim_color = (92, 104, 125)
    muted_color = (142, 155, 176)
    accent_cyan = (0, 242, 254)
    accent_green = (0, 230, 118)
    accent_purple = (157, 78, 221)
    accent_yellow = (255, 179, 0)

    img = Image.new('RGB', (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)

    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 13)
        bold_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 15)
        title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 18)
        mono_font = ImageFont.truetype("/System/Library/Fonts/Monaco.ttf", 12)
        large_mono = ImageFont.truetype("/System/Library/Fonts/Monaco.ttf", 22)
    except:
        font = ImageFont.load_default()
        bold_font = font
        title_font = font
        mono_font = font
        large_mono = font

    # Top Navbar
    draw.rectangle([0, 0, width, 60], fill=header_bg, outline=(40, 50, 70))
    draw.text((20, 18), "🌙 ShadowVault", fill=text_color, font=title_font)
    draw.text((160, 22), "Midnight ZK Protocol", fill=muted_color, font=font)

    # Top Right Badges
    draw.rectangle([width - 430, 15, width - 210, 45], fill=(25, 30, 45), outline=(0, 242, 254))
    draw.text((width - 420, 22), f"setNetworkId('{network_id}')", fill=accent_cyan, font=mono_font)

    btn_color = accent_green if "mn1q" in wallet_status else accent_purple
    draw.rectangle([width - 190, 15, width - 20, 45], fill=btn_color)
    wallet_btn_txt = "mn1q8x...7q8r9s" if "mn1q" in wallet_status else "Connect Lace Wallet"
    draw.text((width - 180, 22), wallet_btn_txt, fill=(10, 10, 10), font=bold_font)

    # Step Banner
    draw.rectangle([30, 75, width - 30, 115], fill=(24, 28, 42), outline=accent_purple)
    draw.text((45, 87), f"📹 Video Demo Step: {step_text}", fill=accent_yellow, font=bold_font)

    # Dashboard Grid
    # Left Card: Circuit Interaction
    draw.rectangle([30, 130, 460, 410], fill=card_bg, outline=(40, 50, 70))
    draw.text((45, 145), "⚡ Contract Circuit Interaction", fill=text_color, font=title_font)
    draw.text((45, 175), "Compact 0.31.1 ZK Prover Engine", fill=accent_cyan, font=mono_font)

    draw.rectangle([45, 205, 445, 245], fill=(25, 30, 45), outline=accent_purple)
    draw.text((60, 217), "[Tab 0] Counter Circuit (active)", fill=accent_yellow, font=bold_font)

    draw.text((45, 260), "Execute real incrementCounter() Compact circuit", fill=muted_color, font=font)
    draw.text((45, 280), "to mutate ledger counter on Midnight chain.", fill=muted_color, font=font)

    # Button
    draw.rectangle([45, 320, 445, 375], fill=(0, 242, 254), outline=(255, 255, 255))
    draw.text((95, 337), "➕ Execute incrementCounter Circuit", fill=(10, 10, 10), font=bold_font)

    # Right Card: Ledger Monitor
    draw.rectangle([490, 130, width - 30, 410], fill=card_bg, outline=(40, 50, 70))
    draw.text((505, 145), "📊 Preprod Ledger State Monitor", fill=text_color, font=title_font)
    draw.text((width - 150, 148), "● Live Sync", fill=accent_green, font=mono_font)

    # Metric Boxes
    draw.rectangle([505, 180, 635, 250], fill=(12, 14, 20), outline=(40, 50, 70))
    draw.text((515, 190), "LEDGER COUNTER", fill=muted_color, font=mono_font)
    draw.text((545, 210), str(counter_val), fill=accent_green, font=large_mono)

    draw.rectangle([650, 180, 780, 250], fill=(12, 14, 20), outline=(40, 50, 70))
    draw.text((660, 190), "VAULT STATE", fill=muted_color, font=mono_font)
    draw.text((670, 215), "ACTIVE", fill=accent_yellow, font=bold_font)

    draw.rectangle([795, 180, width - 45, 250], fill=(12, 14, 20), outline=(40, 50, 70))
    draw.text((805, 190), "DEPOSITS", fill=muted_color, font=mono_font)
    draw.text((830, 210), "1", fill=text_color, font=large_mono)

    # Tx Hash Box
    draw.text((505, 265), "State Transition SHA-256 Transaction Digest:", fill=muted_color, font=font)
    draw.rectangle([505, 285, width - 45, 320], fill=(12, 14, 20), outline=(0, 242, 254))
    draw.text((515, 297), f"0x{tx_hash}", fill=accent_cyan, font=mono_font)

    # Status Tag
    draw.rectangle([505, 335, width - 45, 375], fill=(25, 30, 45), outline=accent_purple)
    draw.text((520, 347), f"Status: {status_msg}", fill=accent_green, font=bold_font)

    # Terminal Log
    draw.rectangle([30, 425, width - 30, 555], fill=terminal_bg, outline=(40, 50, 70))
    draw.text((45, 435), "💻 Transaction & Circuit Execution Terminal Log", fill=dim_color, font=mono_font)
    draw.text((45, 460), f"[System] Initialized ShadowVault. Verified setNetworkId('{network_id}').", fill=accent_green, font=mono_font)
    draw.text((45, 485), f"[Lace Wallet] Status: {wallet_status}", fill=accent_cyan, font=mono_font)
    draw.text((45, 510), f"[Circuit] incrementCounter SUCCESS! On-chain counter: {counter_val}", fill=accent_yellow, font=mono_font)

    return img

def main():
    os.makedirs("assets", exist_ok=True)
    frames = []

    # Frame 1: Initial state
    f1 = render_frame("ShadowVault", "Preprod", "Disconnected", "Undeployed", 0, "0000000000000000000000000000000000000000000000000000000000000000", "Ready to Connect Wallet & Execute Circuit", "1. DApp Loaded, Network setNetworkId('Undeployed')")
    frames.append(f1)

    # Frame 2: Wallet Connected
    f2 = render_frame("ShadowVault", "Preprod", "Connected (mn1q8x9a...7q8r9s)", "Undeployed", 0, "0000000000000000000000000000000000000000000000000000000000000000", "Lace Wallet Connected on Preprod", "2. Click 'Connect Lace Wallet' ➔ Address Verified")
    frames.append(f2)

    # Frame 3: setNetworkId Switcher
    f3 = render_frame("ShadowVault", "Preprod", "Connected (mn1q8x9a...7q8r9s)", "TestNet", 0, "0000000000000000000000000000000000000000000000000000000000000000", "setNetworkId('TestNet') Verified", "3. Select setNetworkId('TestNet') ➔ Network Identifier Updated")
    frames.append(f3)

    # Frame 4: Circuit Execution 1 (Counter -> 1)
    f4 = render_frame("ShadowVault", "Preprod", "Connected (mn1q8x9a...7q8r9s)", "TestNet", 1, "8f3c7e9b2a1d4f6e8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3", "incrementCounter Execution Complete (Counter: 1)", "4. Click 'Execute incrementCounter Circuit' ➔ Counter 0 ➔ 1")
    frames.append(f4)

    # Frame 5: Circuit Execution 2 (Counter -> 2)
    f5 = render_frame("ShadowVault", "Preprod", "Connected (mn1q8x9a...7q8r9s)", "TestNet", 2, "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b", "incrementCounter Execution Complete (Counter: 2)", "5. Second Circuit Call ➔ Counter 1 ➔ 2 (Tx Digest Updated!)")
    frames.append(f5)

    # Save animated GIF
    frames[0].save(
        "assets/demo_video.gif",
        save_all=True,
        append_images=frames[1:],
        duration=1800,
        loop=0
    )
    print("Saved assets/demo_video.gif successfully!")

    # Save animated WebP as well
    frames[0].save(
        "assets/demo_video.webp",
        save_all=True,
        append_images=frames[1:],
        duration=1800,
        loop=0
    )
    print("Saved assets/demo_video.webp successfully!")

if __name__ == "__main__":
    main()
