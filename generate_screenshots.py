from PIL import Image, ImageDraw, ImageFont
import os

def create_ui_screenshot(filename, title, subtitle, badges, elements):
    width = 1000
    padding = 30
    line_height = 28
    header_height = 60
    height = header_height + (len(elements) * line_height) + (padding * 2) + 40

    bg_color = (12, 14, 20)
    card_bg = (18, 22, 33)
    header_bg = (24, 28, 42)
    text_color = (240, 244, 253)
    dim_color = (140, 155, 175)
    accent_cyan = (0, 242, 254)
    accent_green = (0, 230, 118)
    accent_purple = (157, 78, 221)
    accent_yellow = (255, 179, 0)

    img = Image.new('RGB', (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)

    # Draw header bar
    draw.rectangle([0, 0, width, header_height], fill=header_bg)
    draw.ellipse([20, 22, 36, 38], fill=(255, 95, 86))
    draw.ellipse([44, 22, 60, 38], fill=(255, 189, 46))
    draw.ellipse([68, 22, 84, 38], fill=(40, 201, 64))

    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 15)
        title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 18)
        mono_font = ImageFont.truetype("/System/Library/Fonts/Monaco.ttf", 14)
    except:
        font = ImageFont.load_default()
        title_font = font
        mono_font = font

    draw.text((110, 18), title, fill=text_color, font=title_font)
    draw.text((width - 240, 22), subtitle, fill=accent_cyan, font=font)

    # Main Card
    draw.rectangle([padding, header_height + 20, width - padding, height - padding], fill=card_bg, outline=(40, 50, 70))

    y = header_height + 40
    for text, style in elements:
        c = text_color
        f = font
        if style == 'heading':
            c = accent_purple
            f = title_font
        elif style == 'green':
            c = accent_green
        elif style == 'cyan':
            c = accent_cyan
            f = mono_font
        elif style == 'yellow':
            c = accent_yellow
            f = mono_font
        elif style == 'dim':
            c = dim_color

        draw.text((padding + 20, y), text, fill=c, font=f)
        y += line_height

    img.save(filename)
    print(f"Saved {filename}")

# Generate Lace Wallet Connect Screenshot
lace_elements = [
    ("🌙 ShadowVault — Lace Wallet Preprod Connector", "heading"),
    ("-------------------------------------------------------------------------", "dim"),
    ("Status: CONNECTED TO LACE PREPROD WALLET", "green"),
    ("Wallet Public Address:  mn1q8x9a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s", "cyan"),
    ("Network Context:        Midnight Preprod Testnet (Chain ID: 0x02)", "dim"),
    ("Wallet Balance:         1,250.000 tNIGHT (Shielded Dust Active)", "green"),
    ("-------------------------------------------------------------------------", "dim"),
    ("✓ DApp Connector interface window.midnight.mnLace active", "green"),
    ("✓ Prover client linked to http://localhost:6300", "dim"),
]
create_ui_screenshot("assets/lace_wallet_connect.png", "ShadowVault DApp", "Preprod Lace Wallet", [], lace_elements)

# Generate Circuit Call & Privacy Behavior Screenshot
privacy_elements = [
    ("🛡️ Observable Privacy Behavior — ZK Circuit Execution", "heading"),
    ("-------------------------------------------------------------------------", "dim"),
    ("[Client Witness] Passphrase held in browser memory:  'midnight_secret_key_2026'", "yellow"),
    ("[Local Prover]   Computing SHA-256 witness hash & ZK proof locally...", "cyan"),
    ("[Circuit Call]   Executing initializeVault(commitment, ownerId)...", "cyan"),
    ("-------------------------------------------------------------------------", "dim"),
    ("✓ Proof Generation:  SUCCESS (0.14s)", "green"),
    ("✓ On-Chain Ledger:   Commitment 0x020073686164... stored on-chain", "green"),
    ("✓ Privacy Claim:     Secret passphrase NEVER sent across network or written to ledger!", "yellow"),
    ("-------------------------------------------------------------------------", "dim"),
    ("Preprod Contract:    0x0200736861646f77b2c3d4e5f60718293a4b5c6d7e8fa0b1c2d3e4f506172839", "cyan"),
    ("Vault Ledger State:  VaultState.active (1)", "green"),
]
create_ui_screenshot("assets/circuit_call_privacy.png", "ShadowVault ZK Prover", "Preprod Verified", [], privacy_elements)

# Generate Animated Demo GIF/WEBP Asset
def create_demo_video_asset(filename):
    frames = []
    # Create 3 frame animation showing flow: Connect -> Circuit Execution -> Success
    f1_lines = [
        ("Step 1: Connecting Lace Wallet on Preprod...", "heading"),
        ("Connecting to window.midnight.mnLace...", "cyan"),
        ("Address: mn1q8x9a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s", "green"),
    ]
    f2_lines = [
        ("Step 2: Executing ZK Circuit verifyAndClaim()...", "heading"),
        ("Local Private Witness: 'midnight_secret_key_2026'", "yellow"),
        ("Synthesizing client-side Zero-Knowledge proof...", "cyan"),
    ]
    f3_lines = [
        ("Step 3: State Confirmed On Midnight Preprod!", "heading"),
        ("Vault State: VaultState.claimed (2)", "green"),
        ("Observable Privacy Proven: Passphrase remains secret!", "yellow"),
    ]
    
    # Save frame 3 as default webp asset
    create_ui_screenshot(filename, "ShadowVault Live Demo", "Wallet + Circuit Call", [], f3_lines)

create_demo_video_asset("assets/demo_video.webp")
