import subprocess
import time
import sys

apple_script = '''
tell application "Google Chrome"
  set winList to every window
  repeat with w in winList
    set u to URL of active tab of w
    if u contains "midnight-authorize-dapp" or u contains "midnight-wallet-unlock" or u contains "midnight" and u contains "chrome-extension://" then
      set bounds of w to {480, 150, 980, 850}
      set index of w to 1
      activate
      return "FOCUSED_LACE"
    end if
  end repeat
  return "NONE"
end tell
'''

def main():
    print("[Watcher] Started Lace popup window watcher daemon...", flush=True)
    last_state = False
    while True:
        try:
            p = subprocess.run(["osascript", "-e", apple_script], capture_output=True, text=True, timeout=5)
            out = p.stdout.strip()
            if "FOCUSED_LACE" in out and not last_state:
                print("[Watcher] Lace authorization popup detected -> Brought to front & centered!", flush=True)
                last_state = True
            elif "NONE" in out:
                last_state = False
        except Exception as e:
            pass
        time.sleep(0.4)

if __name__ == "__main__":
    main()
