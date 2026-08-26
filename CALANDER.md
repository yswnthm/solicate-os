# apple calendar access and event guide

this document explains how to read and add events to apple calendar using simple commands, matching the lowercase naming style.

---

## 1. naming style rules

follow these rules for all event titles:
* use all lowercase letters only. no capital letters.
* keep sentences simple, plain, and direct.
* use category/action patterns with slashes or dashes when applicable:
  * `solicate admin - remember when healthcare`
  * `listen to the voice notes and make a clear notes on it`
  * `photos/sorting`
  * `order-by fix/work`
  * `posts instagram. yswnthm acc`
  * `fresh/relax`
  * `fresh/wakeup`
  * `walking`

---

## 2. available calendar targets

choose the right calendar name based on the context:
* `solicate` - client work, proposals, strategy, client ops
* `work/system` - internal dev, coding, systems, social posts, admin tasks
* `college` - classes, labs, mid exams, study blocks
* `home` - family commitments, events, personal errands
* `learning` - deep reading, research, skill building
* `rest/fun🪐` - sleep, wakeup routine, relaxation, breaks
* `workout` - walking, gym, fitness
* `games` - chess, play sessions
* `work.yeswanth@gmail.com` - google synced events

---

## 3. how to check and read calendar events

run this applescript command to view events across any date range:

```bash
osascript -e '
tell application "Calendar"
    set d1 to current date
    set hours of d1 to 0
    set minutes of d1 to 0
    set seconds of d1 to 0
    set d2 to d1 + (5 * days)
    
    set res to ""
    set calList to {"solicate", "work/system", "college", "home", "learning", "rest/fun🪐", "workout", "games"}
    
    repeat with c in calList
        try
            tell calendar (contents of c)
                set evs to (events whose start date >= d1 and start date <= d2)
                repeat with e in evs
                    set evTitle to summary of e
                    set evStart to start date of e
                    set evEnd to end date of e
                    set evAllDay to allday event of e
                    set res to res & "[" & (contents of c) & "] " & evTitle & " | " & (evStart as string) & " to " & (evEnd as string) & linefeed
                end repeat
            end tell
        end try
    end repeat
    return res
end tell
'
```

---

## 4. how to add a new event to calendar

run this command to add an event directly to any target calendar:

```bash
osascript -e '
tell application "Calendar"
    tell calendar "solicate"
        set eventStartDate to current date
        -- example: set to tomorrow at 2:00 pm
        set day of eventStartDate to 27
        set hours of eventStartDate to 14
        set minutes of eventStartDate to 0
        set seconds of eventStartDate to 0
        
        -- example: 2 hour duration (4:00 pm end)
        set eventEndDate to eventStartDate + (2 * hours)
        
        make new event with properties {summary:"prepare remember when strategy doc", start date:eventStartDate, end date:eventEndDate, description:"drafting 30-day growth and positioning doc"}
    end tell
end tell
'
```

---

## 5. quick single-line command template

replace calendar name, event title, date and time:

```bash
osascript -e 'tell application "Calendar" to tell calendar "solicate" to make new event with properties {summary:"strategy doc - remember when healthcare", start date:(date "Thursday, 27 August 2026 at 2:00:00 PM"), end date:(date "Thursday, 27 August 2026 at 4:30:00 PM")}'
```
