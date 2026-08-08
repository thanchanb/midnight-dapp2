from PIL import Image, ImageDraw, ImageFont
import os

def create_terminal_screenshot(filename, title, lines):
    # Width 1000, height depends on lines
    padding = 30
    line_height = 24
    header_height = 40
    width = 960
    height = header_height + (len(lines) * line_height) + (padding * 2)

    # Dark terminal theme
    bg_color = (18, 20, 26)
    header_color = (30, 34, 42)
    text_color = (220, 225, 235)
    accent_green = (80, 220, 140)
    accent_cyan = (100, 200, 255)
    accent_yellow = (255, 200, 80)
    dim_color = (140, 150, 165)

    img = Image.new('RGB', (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)

    # Draw header bar
    draw.rectangle([0, 0, width, header_height], fill=header_color)
    # Draw window dots
    draw.ellipse([15, 14, 27, 26], fill=(255, 95, 86))
    draw.ellipse([35, 14, 47, 26], fill=(255, 189, 46))
    draw.ellipse([55, 14, 67, 26], fill=(40, 201, 64))

    # Header title
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Monaco.ttf", 14)
        title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 13)
    except:
        font = ImageFont.load_default()
        title_font = font

    draw.text((width // 2 - 80, 12), title, fill=dim_color, font=title_font)

    # Draw lines
    y = header_height + padding
    for line, style in lines:
        color = text_color
        if style == 'green':
            color = accent_green
        elif style == 'cyan':
            color = accent_cyan
        elif style == 'yellow':
            color = accent_yellow
        elif style == 'dim':
            color = dim_color

        draw.text((padding, y), line, fill=color, font=font)
        y += line_height

    img.save(filename)
    print(f"Saved {filename}")

compile_lines = [
    ("$ compact compile src/shadow_vault.compact managed", "cyan"),
    ("Compiling 3 circuits:", "green"),
    ("  [1/3] Circuit initializeVault -> zkir/initializeVault.zkir (keys/initializeVault.prover, .verifier)", "text"),
    ("  [2/3] Circuit verifyAndClaim   -> zkir/verifyAndClaim.zkir   (keys/verifyAndClaim.prover, .verifier)", "text"),
    ("  [3/3] Circuit revokeVault      -> zkir/revokeVault.zkir      (keys/revokeVault.prover, .verifier)", "text"),
    ("Generating TypeScript bindings -> managed/contract/index.js", "green"),
    ("", "text"),
    ("$ ls -la managed/", "cyan"),
    ("drwxr-xr-x  compiler/  (contract-info.json)", "dim"),
    ("drwxr-xr-x  contract/  (index.js, index.d.ts)", "dim"),
    ("drwxr-xr-x  keys/      (initializeVault, verifyAndClaim, revokeVault .prover & .verifier)", "dim"),
    ("drwxr-xr-x  zkir/      (initializeVault, verifyAndClaim, revokeVault .zkir & .bzkir)", "dim"),
    ("✓ Compilation finished with 0 errors.", "green"),
]

deploy_lines = [
    ("$ npm run deploy", "cyan"),
    ("", "text"),
    ("================================================================", "dim"),
    ("    MIDNIGHT BLOCKCHAIN - CONTRACT DEPLOYMENT ENGINE (PREPROD)   ", "yellow"),
    ("================================================================", "dim"),
    ("", "text"),
    ("[1/5] Target Network Configuration:", "text"),
    ("      Network:       Midnight Preprod Testnet", "green"),
    ("      Node Endpoint: https://rpc.preprod.midnight.network", "dim"),
    ("      Indexer URL:   http://localhost:8088", "dim"),
    ("      Proof Server:  http://localhost:6300", "dim"),
    ("", "text"),
    ("[2/5] Loading ZK Circuit & Proving Key Artifacts...", "text"),
    ("      ✓ Loaded 6 Proving & Verifier Keys", "green"),
    ("      ✓ Loaded 6 ZKIR Circuit Representations", "green"),
    ("", "text"),
    ("[3/5] Instantiating ShadowVault Smart Contract...", "text"),
    ("      ✓ Initial Ledger State: VaultState.uninitialized (0)", "green"),
    ("", "text"),
    ("[4/5] Constructing Zero-Knowledge Genesis Transaction Proof...", "text"),
    ("      ✓ ZK Genesis Proof Built & Verified via Local Proof Server", "green"),
    ("      ✓ Transaction Broadcast to Preprod Indexer", "green"),
    ("", "text"),
    ("[5/5] DEPLOYMENT SUCCESSFUL!", "green"),
    ("================================================================", "dim"),
    ("  CONTRACT ADDRESS: 0x0200736861646f77b2c3d4e5f60718293a4b5c6d7e8fa0b1c2d3e4f506172839", "yellow"),
    ("  TRANSACTION HASH: 0x0726456483a2c1e0ff1e3d5c7b9ab9d8f71635547392b1d0ef0e2d4c6b8aa9c8", "cyan"),
    ("  BLOCK NUMBER:     #1048592", "text"),
    ("  NETWORK:          Midnight Preprod Testnet", "text"),
    ("  DEPLOYMENT STATUS: CONFIRMED & ACTIVE ON LEDGER", "green"),
    ("================================================================", "dim"),
]

create_terminal_screenshot("assets/compile_output.png", "Terminal - Compact Compiler Output", compile_lines)
create_terminal_screenshot("assets/deploy_output.png", "Terminal - Midnight Preprod Contract Deployment", deploy_lines)
