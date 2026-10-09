# Language Standards & Prose Craft Guide
### For Novel-Style Narrative Writing & Character Dialogue in a D&D Campaign Bible

> **Lord DnD addendum version 2.2.0 — 2026-08-28.** This release retains the complete 2.1.0 merge—both historical 1.9.0 branches plus event-ledger, chest/exclusive and fixed-rank presentation rules—and adds the official-runtime projection contract: exact mechanical consequences, adaptive scene/management modes, causal receipts, scoped diagnostic disclosure and presentation-failure isolation.

> **Release lock:** `document_id=LORD-DND-LANGUAGE-STANDARDS`; `release_id=LANG-2.2.0-OFFICIAL-RUNTIME.1`. A resolver must verify `document_id + semantic_version + sha256` against `RELEASE-LINEAGE-LL01-1.1.0`; bare `v1.9.0` is `AMBIGUOUS_SEMVER` because two unequal payloads used that label.

---

## 0. Purpose & How to Use This Guide

This document sets the language standards for all narrative prose, in-world documents, and character dialogue written for the campaign bible. It exists so that entries written months apart still sound like they belong to the same book, so dialogue is recognizable per speaker without needing a tag on every line, and so the bible reads like a novel someone would want to read for its own sake — not just a reference binder.

Treat this as a living style sheet, not a fixed law. When you make a judgment call this document doesn't cover, write it down in **Section 9.4 (Style Sheet Addendum)** so it becomes a standing rule instead of a one-off decision that quietly drifts.

---

## 1. Foundational Voice Standards

### 1.1 Point-of-View Lock
The Lord DnD campaign uses **close third through Lí Lan** for every playable scene and past tense for narration. The camera may report only her available senses, interface output and legitimately known inferences. It must not invent her speech, deliberate thought, chosen emotion or action; those remain controlled by `{{user}}`. The other modes below remain reference rules for non-playable material:

- **Close third (recommended default)** — "Kestrel felt the floor give before she heard it." The camera sits behind one character's eyes per scene, but the narrator can use vocabulary that character wouldn't. This is the best fit for a campaign bible because it lets you narrate any NPC's chapter without switching to first person and constantly re-anchoring "I."
- **Omniscient-lite** — acceptable for setting overviews and landing pages with no single POV character, but never let it bleed into a scene that already has a POV character established.
- **First person** — reserve for in-world documents (journals, letters) only. Never use it for the bible's own narrating voice.

**Rule:** one POV character per scene. If a second character's interior state needs showing, cut to a scene break — don't head-hop mid-paragraph.

> Bad: *Kestrel felt sick. Bron, meanwhile, was secretly relieved she hadn't noticed the blade.*
> Good: *Kestrel felt sick.* [scene break] *Bron watched her go pale and let himself exhale. She hadn't noticed the blade.*

### 1.2 Tense
Past tense for all narration and dialogue. Present tense is reserved for: (a) in-world prophetic or ritual text where present tense is a deliberate stylistic marker, and (b) read-aloud boxes if the table prefers second-person present ("You see..."). Never mix past and present within one narrative passage.

### 1.3 Narrative Distance
Default to close narrative distance — inside the POV character's sensory and emotional experience — for any scene meant to be *felt*. Pull back to a more reportorial voice only for montage or summary passages ("The siege lasted six days"), then push back in before the scene resumes.

### 1.4 Diction Register
Baseline register: **elevated but readable** — not modern-casual, not Shakespearean pastiche. Quick test: if a line would sit naturally in a contemporary thriller, it's fine; if it needs "thee/thou/verily" to feel "fantasy enough," it's overcorrecting.

Avoid unless a specific character's voice calls for it deliberately: "okay," "yeah," "gonna," corporate jargon ("circle back," "bandwidth"), modern tech metaphors ("like a computer crashing"). Prefer period-flavored equivalents drawn from the setting's own vocabulary instead.

---

## 2. Prose Mechanics

### 2.1 Sentence Rhythm & Variety
Vary sentence length on purpose — a paragraph of uniform medium-length sentences reads flat. Use short sentences to land a beat. Use one longer, clause-heavy sentence per paragraph to carry momentum or interiority.

> *The gate held. For now. Somewhere above them, chains groaned against a weight they were never built to bear, and Kestrel understood, with the particular clarity of people about to die, that the sound was getting louder.*

### 2.2 Show, Don't Tell — Applied, Not Just Quoted
"Show, don't tell" doesn't mean *never name an emotion* — it means don't name it and then demonstrate it redundantly. Pick one.

> Bad (tell + show stacked): *She was furious. Her hands shook and her voice rose to a shout.*
> Good (show only): *Her hands shook. "Get out," she said, and it came out as a shout.*
> Also good (tell, to compress time): *She was too angry to speak. She left.*

Use "tell" to skip an unimportant beat quickly; use "show" when you want the reader to sit inside the moment.

### 2.3 Filter Words to Cut
Filter words put a pane of glass between the reader and the character's experience by reminding the reader a narrator is relaying it. In close POV, cut them by default.

| Filter word | Why it weakens the line | Fix |
|---|---|---|
| felt | Tells the reader to feel instead of making them feel | State the sensation directly: "Her stomach dropped," not "She felt her stomach drop" |
| saw / watched | Redundant in close POV — we're already behind their eyes | "The door opened," not "She saw the door open" |
| noticed / realized | Adds a layer of narration over an observation | State the observation directly; let the realization be implicit |
| heard | Same issue as *saw* | "Footsteps, close," not "She heard footsteps" |
| wondered / thought | Fine occasionally; overuse flattens interiority into commentary | Prefer direct interior monologue over "she thought that..." |

### 2.4 Sensory Grounding
Anchor every scene in at least two senses beyond sight within its opening paragraphs — smell and sound are the most underused and do the most work in fantasy prose (a throne room smells like beeswax and old stone; a dungeon smells like wet iron). Weave sensory detail into action rather than stopping for a static paragraph of scenery.

### 2.5 Paragraph & Pacing Control
- Action beats: short paragraphs, short sentences, minimal subordinate clauses.
- Introspection or worldbuilding exposition: longer paragraphs are fine, but break up anything over roughly 150 words with a beat of action or dialogue.
- One idea per paragraph. If a paragraph is doing two jobs — describing the room *and* advancing a decision — split it.

### 2.6 Anachronism Filter
Keep a running "banned word" list per setting so modern intrusions get caught before they calcify. Starter list to adapt:

- Corporate/modern idiom: "on the same page," "touch base," "deep dive," "at the end of the day"
- Modern tech metaphor: "like a broken record," "on autopilot," "hardwired"
- Modern measurement: "in a New York minute," "like a freight train" (unless the setting actually has trains)
- Modern psychological jargon: "trigger," "toxic," "gaslighting" — describe the behavior instead of naming it with a clinical modern term

---

## 3. Dialogue Craft

### 3.1 Formatting Standard
- Double quotation marks for spoken dialogue; single quotes only for a quote-within-a-quote.
- New paragraph every time the speaker changes — no exceptions, even for a one-word reply.
- An action beat belonging to the *speaker* stays in the same paragraph as their line. A beat belonging to someone *else* starts a new paragraph, even if that person hasn't spoken yet.
- Punctuation: comma before the closing quote if a tag follows ("Go," she said.); period if the beat is its own sentence ("Go." She turned away.)

### 3.2 Attribution — Tags vs. Action Beats
Once a scene has more than two speakers, or has run more than a couple of exchanges, lean on action beats over bare tags — a beat does double duty (attribution + characterization + pacing) that a tag alone can't.

> Bad: *"I don't trust him," Kestrel said angrily.*
> Good: *Kestrel's jaw tightened. "I don't trust him."*

### 3.3 The "Said" Rule
Default tag is "said" (or "asked" for questions) — it's functionally invisible and doesn't compete with the dialogue for attention. Reserve non-neutral tags ("snapped," "hissed," "murmured") for moments where the manner of speaking genuinely isn't inferable from context, and never stack one with an adverb (see 3.4).

Avoid tags describing actions that can't physically produce speech — "she laughed the words," "he smiled his answer." Smiling and laughing are things a face does, not a delivery mechanism. Use a beat instead: *He smiled. "Sure it is."*

### 3.4 Adverb Discipline
An adverb on a dialogue tag is almost always a patch over dialogue that isn't doing its job. If a line needs "she said sarcastically" to land as sarcasm, rewrite the line so the sarcasm is audible in the words themselves.

> Bad: *"That's a great plan," she said sarcastically.*
> Good: *"That's a great plan," she said. "Truly. Inspired."*

### 3.5 Subtext — People Rarely Say What They Mean
The strongest dialogue writes around the actual point rather than through it. A character asking for help rarely says "I need help" — they mention the problem and let the request sit underneath it. Give important conversations a stated topic and a real topic, and let the gap between them carry the tension.

> *"You've redecorated," Kestrel said, looking at the sealed door where the old one used to be.*
> (Stated topic: décor. Real topic: *you're keeping me out.*)

### 3.6 Interruptions, Trailing Off, Overlaps
- Hard interruption by another speaker: em dash, no closing punctuation inside the quote — *"I only meant—" "I know what you meant."*
- Self-interruption into silence: ellipsis — *"I just thought maybe..."*
- Talking over each other: use sparingly, since it's hard to read. Break into short alternating lines rather than one run-on paragraph.

### 3.7 Naturalistic Rhythm
Real speech is not grammatical prose. Within the bounds of the setting's register:

- Use contractions for casual or emotional speech; reserve full forms ("do not," "cannot") for formal, ceremonial, or non-native speech as a deliberate register marker.
- Fragments are allowed and often stronger than full sentences: *"Fine." "Fine? That's it, fine?"*
- Let characters dodge the question they were asked sometimes — real conversation deflects.
- Silence is a valid beat. Not every line needs a reply; *Bron said nothing* can carry more weight than a rebuttal would.

### 3.8 Avoiding As-You-Know-Bob / Info-Dumping
Characters should never tell each other things they both already know, purely to inform the reader. Test any expository line by asking: would this character actually say this, to this listener, given what the listener already knows? If not, find another delivery — a document, an outsider character asking real questions, or trust the reader to infer it.

> Bad: *"As you know, the Duke banned magic in the city thirty years ago after the Ashfall."*
> Good: a newcomer asking "Why is everyone staring at my staff?" and getting a clipped, partial answer that raises more questions than it answers.

### 3.9. Kênh trò chuyện công cộng trực tiếp

Tin nhắn trên Kênh Khu Vực hoặc Kênh Thế Giới không dùng chuẩn chỉnh sửa của lời thoại tiểu thuyết. Người chơi đang lạnh, đau, hoảng, vừa mất gia đình hoặc phải gõ trong lúc làm việc có thể viết chữ thường, bỏ dấu câu, gõ sai, lặp chữ, ngắt giữa câu, gửi hai đến bốn tin thay cho một câu hoàn chỉnh, dùng chữ hoa, ký hiệu cảm xúc và viết tắt tiếng Việt. Chỉ giữ văn viết đầy đủ cho người có dấu gõ ấy hoặc cho tin họ đã có thời gian soạn.

Mỗi người lặp lại cần một **dấu gõ** riêng: độ dài quen thuộc, cách viết hoa, mức dùng dấu, lỗi thường gặp, nhịp gửi liên tiếp, từ viết tắt, thói quen trích lời, thái độ với bằng chứng và kiểu phản ứng khi căng thẳng. Lỗi gõ phải có quy luật vừa đủ để nhận ra người, không rải ngẫu nhiên lên mọi dòng và không biến họ thành trò hề.

Một đoạn kênh thất bại nếu bỏ tên người gửi mà mọi câu vẫn có thể đổi chỗ cho nhau. Nó cũng thất bại nếu mọi câu đều là thông tin có ích, mọi câu hỏi đều được trả lời hoặc nhiều người lần lượt đọc ra chính xác một hướng dẫn cơ học.

**Sai — bảng hướng dẫn đội lốt người chơi:**

> **[Người chơi 1842]:** Nhà lãnh chúa cần đúng 10 đá và 20 gỗ. Sửa xong mới mở thêm công trình.
> **[Người chơi 7710]:** Tôi xác nhận thông tin trên là chính xác.

**Đúng — một dữ kiện lọt ra giữa các mạch chồng nhau:**

> **[lamlam]:** nhà sửa bn gỗ v mn  
> **[Cửu_Đao]:** 20  
> **[lamlam]:** đá??  
> **[NgủQuên]:** tay t tê hết r có ai nhóm lửa dc chưa  
> **[THU_GỖ_9]:** ĐỔI BÁNH LẤY GỖ NHẮN RIÊNG  
> **[BắpRang]:** chợ chưa mở ông đổi bằng lời thề à :))  
> **[MộcMiên]:** vừa sửa xong. kho trừ 10 đá + 20 gỗ, đây [ảnh]  
> **[lamlam]:** 20 đá 10 gỗ hả  
> **[MộcMiên]:** ngược  
> **[HổCon]:** -17 33 ai gần ko  
> **[HổCon]:** -17 33  
> **[KẻKhôngTin]:** ảnh cắt mất góc. ai có ảnh khác?

Thông tin có ích vẫn xuất hiện, nhưng người đọc phải nhận ra nguồn, phát hiện sự đọc nhầm và quyết định có kiểm chứng hay không. Kênh không làm thay công việc suy luận ấy.

**Cùng một kênh vào ngày thứ ba — ít tiếng hét hơn vì thích nghi và mất dấu, không phải vì mọi người bỗng trở thành chuyên gia:**

> **[MộcMiên]:** băng phía tây nứt lúc gần sáng. ảnh lúc 05:12 đây [ảnh]  
> **[KẻKhôngTin]:** ảnh có hướng hạch ko  
> **[MộcMiên]:** góc trái  
> **[THU_GỖ_9]:** 1 BÁNH = 9 GỖ. NHẬN TRONG 10P  
> **[BắpRang]:** hôm đầu 12 gỗ mà tận thế cũng có giảm giá ha  
> **[HàMy]:** có ai còn thấy Phúc ko tối qua ảnh kêu đau chân  
> **[HổCon]:** -17 33 bỏ đi. hạch tắt rồi  
> **[lamlam]:** rõ  
> **[HàMy]:** Phúc?

Các tên quen vẫn giữ dấu gõ, nhưng lời đã ngắn và lạnh hơn. Câu cuối không được người kể tự giải thích; sự im lặng chỉ trở thành cái chết khi có bằng chứng.

---

## 4. Character Voice Differentiation

### 4.1 The Voice Bible
For every recurring speaking character, keep a short worksheet (it can live inside that character's own bible entry):

- **Vocabulary band**: educated/formal, plain/practical, crude/slang, archaic
- **Sentence-length habit**: clipped, average, run-on/rambling
- **Signature construction**: front-loads with a question? trails off? over-qualifies ("I suppose," "perhaps")?
- **One or two verbal tics**, used no more than once every few pages — overuse turns a tic into a caricature
- **What they never say**, which is as useful as what they do (a soldier who never swears; a noble who never uses a first name)

#### 4.1.1 Lí Lan — hồ sơ đã khóa

| Trường | Chuẩn |
|---|---|
| Vocabulary band | có học thức, chính xác, thiên về vận hành/rủi ro; tránh biệt ngữ an ninh mạng nếu người nghe không hiểu |
| Sentence-length habit | ngắn đến trung bình; khi căng thẳng càng ngắn và có tính thủ tục |
| Signature construction | hỏi thẳng bằng chứng, giới hạn, chi phí, thời hạn hoặc điểm hỏng; kết luận bằng bước xử lý thay vì lời trấn an |
| Acoustic delivery | giọng nữ khàn, bình tĩnh, ngữ điệu phẳng/gần như chết; lạnh hơn với một số người, nhưng không phải lúc nào cũng thù địch |
| Moral vocabulary | đánh giá tác nhân theo mức hữu dụng khi sống hoặc chết; không tự thêm ghê sợ thi thể, thương xót hay khoái cảm tàn sát |
| Never says by default | diễn văn đạo đức, an ủi rỗng, khoe sự tàn nhẫn, đe dọa dài hoặc lời tự giải thích cảm xúc |

Hồ sơ này chỉ render lời khi `{{user}}` đã cung cấp nội dung/ý định hoặc yêu cầu biên tập lời của Lí Lan. Không dùng nó để tự quyết định Lí Lan sẽ nói gì.

### 4.2 Vocabulary Bandwidth
Vary not just *what* characters say but the size of vocabulary available to them. A scholar reaches for precise, Latinate words; a caravan guard reaches for concrete, physical ones — same idea, two voices:

- Scholar: *"The wards are failing in a cascading sequence, west to east."*
- Guard: *"Whatever's holding this place up is coming down, and it's coming down fast."*

### 4.3 Syntax Fingerprint
Vary sentence *shape*, not just word choice. One character might front-load subordinate clauses ("Given what happened at the bridge, I won't be going back"); another tacks them on at the end ("I won't be going back, not after the bridge"). Dialogue read aloud with tags stripped out should still let you tell speakers apart.

### 4.4 Verbal Tics & Catchphrases
Use sparingly. A tic used every line stops being characterization and becomes a tell. One recognizable habit per major character is plenty — save it for a moment where it actually lands rather than deploying it on every line.

### 4.5 Register by Class, Culture, or Faction
A shared register key keeps every contributor calibrating the same way:

| Archetype | Formality | Sample line |
|---|---|---|
| Noble court | High formality, indirect requests, rank-conscious phrasing | "One does not simply demand an audience with the Ashenwood." |
| Clergy/religious order | Ceremonial cadence, repetition, doctrinal invocation | "By the Ember and the Ash, we do not turn away the wounded." |
| Rustic/village | Plain, concrete, habitual present tense | "Storms come up fast off the ridge this time of year." |
| Criminal underworld | Clipped, euphemistic about specifics | "Package's ready when the coin is." |
| Military/guard | Clipped, procedural, rank-first address | "Captain wants a headcount before the gate opens." |
| Non-native speaker of the common tongue | Simplified grammar, occasional literal idiom from their own tongue — never a comedic broken-speech stereotype | "This road, it does not go where you think it goes." |

### 4.6 Accent on the Page
Suggest accent through word choice, syntax, and rhythm — not phonetic spelling ("th' castle," "ye ken"). Heavy phonetic spelling slows reading and can read as mocking. One or two consistent, non-phonetic markers — a dropped auxiliary verb, a distinctive idiom, a habitual sentence-final tag — do more work than misspelling every word.

---

## 5. World-Specific Language Standards

### 5.1 Proper Noun & Capitalization Rules
- **Capitalize**: named deities, named organizations or orders, a magic school or event used as a proper title ("the Wound," "the Ashfall"), a title used with a name ("Duke Ashenwood") or standing alone in direct address ("yes, Duke").
- **Lowercase**: generic references to a role or type (a duke somewhere in the realm, a wizard, a god — unless naming a specific one), and directions unless part of a proper region name.
- Keep a running glossary (Section 9.5) so "the Wound" doesn't later get written as "the wound" by a different contributor.

### 5.2 Naming Convention Consistency
Assign each culture or species a distinct phonetic and structural naming pattern and hold to it. Mixing conventions at random is the fastest way to make a world feel unplanned. Document the pattern once (e.g., "coastal-culture names are two syllables, vowel-ending, no hard consonant clusters") and check new names against it before adding them.

### 5.3 Invented Oaths, Curses, Idioms
Replace real-world religious oaths ("god," "hell," "damn") with setting-appropriate equivalents tied to your cosmology, and reuse the same handful consistently rather than inventing a new one every scene. A few recurring invented oaths ("Ashes take it," "by the Ember") read as culture; a different one every time reads as a thesaurus exercise.

### 5.4 Titles & Forms of Address
Fix, in the glossary, exactly how each rank is addressed directly versus referred to in narration (e.g., addressed as "my lord," referred to in narration as "the baron"), and whether commoners and nobles use different address forms for the same rank.

### 5.5 Units, Calendars, Measurements
Decide once whether the world uses real-world units (miles, days of the week) or invented ones, and hold the line — switching between "three leagues" and "ten miles" across different entries breaks immersion for attentive readers.

---

## 6. Grammar & Formatting Mechanics

### 6.1 Punctuation for Interruption / Trailing Off
Standardize (see also 3.6): em dash for a hard interruption, ellipsis for trailing off — never both in the same line.

### 6.2 Internal Thought Formatting
Pick one convention and hold it document-wide:

- Italicized direct thought, present tense, no quotation marks: *He's lying.*
- Un-italicized free indirect style folded into third-person past narration: *He was lying, obviously.*

Don't mix both conventions within the same POV character's sections.

### 6.3 In-World Documents
Letters, journals, and inscriptions quoted inside the bible get their own visual treatment — typically a blockquote or indented block, first person, and may deliberately break the register rules above (an illiterate character's note can be short and ungrammatical on purpose). Label these clearly as in-world artifacts, distinct from narration.

### 6.4 Numbers & Dates
Spell out numbers under one hundred in narration; use numerals in game-mechanical stat blocks. Fix one calendar system (see 5.5) and use it consistently across all dated entries.

---

## 7. Scene & Pacing Craft

### 7.1 Scene vs. Sequel Structure
A **scene**: a character wants something, meets an obstacle, ends better or worse off, in real time. A **sequel**: the aftermath — reaction, brief reflection, next decision — usually shorter, and can compress time. Alternate them. Don't chain three action scenes with no sequel breath between them, and don't let a sequel run so long it stalls momentum.

### 7.2 Dialogue / Action / Introspection Ratio
No fixed ratio, but audit any scene that's run more than a page in a single mode. Pure dialogue for three pages needs an action beat or sensory grounding dropped back in; pure action for three pages needs an emotional beat to land the stakes.

### 7.3 Chapter & Session Breaks
End narrated entries on a decision, a reveal, or a question — not on a settled, resolved beat — to carry momentum forward. Purely reference entries (no scene) don't need this; reserve narrative hooks for entries that actually narrate a scene.

---

## 8. Common Style Pitfalls (Sins List)

Quick self-audit before finalizing any entry:

1. **Adverb overload** on tags or descriptions — cut on sight, rewrite the line instead.
2. **Echo words** — the same distinctive word twice in one paragraph.
3. **Name-tag overuse** — naming a character in dialogue attribution when an action beat would do more work.
4. **Purple prose** — three or more adjectives stacked on one noun; cut to the one that matters.
5. **As-you-know-Bob exposition** (see 3.8).
6. **Head-hopping** mid-scene (see 1.1).
7. **Filter-word buildup** (see 2.3).
8. **Anachronistic idiom** slipping past the register filter (see 2.6).
9. **Tic overuse** turning a character quirk into caricature (see 4.4).
10. **Inconsistent proper-noun capitalization** across entries (see 5.1) — check the glossary before publishing.

---

## 9. Quick-Reference Checklists

### 9.1 Prose Checklist
- [ ] POV locked for the whole scene
- [ ] Tense consistent throughout
- [ ] Filter words audited and cut where unnecessary
- [ ] At least two senses grounded in the opening beats
- [ ] No paragraph doing two jobs at once
- [ ] Anachronism filter run against the Section 2.6 list

### 9.2 Dialogue Checklist
- [ ] New paragraph per speaker
- [ ] Tags default to "said"; non-neutral tags have earned their place
- [ ] No adverb patching a flat line
- [ ] At least one line per major conversation carries subtext, not just information
- [ ] Read aloud with tags removed — can you still tell speakers apart?

### 9.3 Consistency Checklist for Campaign Bible Entries
- [ ] Character's voice matches their Voice Bible worksheet (4.1)
- [ ] Proper nouns match the glossary (9.5)
- [ ] Names match the culture's naming convention (5.2)
- [ ] Units and calendar match the fixed standard (5.5)
- [ ] Titles and forms of address match Section 5.4

### 9.4 Style Sheet Addendum *(living log)*
Record new judgment calls here as they're made, so a one-off decision becomes a standing rule.

| Date | Ruling | Reason |
|---|---|---|
| 2026-08-13 | Mọi bảng nhân vật, bảng trạng thái, khối chỉ số và lời hệ thống dùng từng dòng: `T<n>` thành `Bậc <n>`, `Lv<n>` thành `Cấp <n>`, phẩm trơ thành `Phẩm <tên>`, mã `H...` được viết bằng trạng thái hạch hoặc lãnh địa; mọi số cùng phẩm đã biết phải được giữ lại. Chỉ bản số liệu thô hoặc bản kiểm lỗi do người dùng yêu cầu mới mở mã nội bộ. | Giữ giao diện ngắn, nhất quán và có ý nghĩa mà không làm mất số liệu cơ chế. |

### 9.5 Glossary *(living log)*
Track every proper noun's exact spelling and capitalization on first use.

| Term | Capitalization | First used in |
|---|---|---|
| — | — | — |

---

## 10. Worked Example — Before and After

**Before** *(violates several rules above)*:
> Kestrel felt really angry. "I can't believe you did that," she said angrily, watching him nervously. As you know, the Ashfall happened thirty years ago, and everyone in the city still remembers it, so of course he shouldn't have used magic in public. She felt her heart pounding fast.

**After**:
> Kestrel's hands curled into fists. "You used magic. In the square." Around them, the crowd had already started to scatter — thirty years since the Ashfall, and the city still flinched at the smell of ash. "Do you understand what you've done?"

**What changed**: filter words cut; the adverb-patched tag replaced with an action beat; exposition moved out of dialogue and into grounded narration (the crowd's reaction) instead of a lecture; subtext added — the real question isn't information, it's accusation.

---

## 11. Lord DnD — Định dạng từng dòng đã Việt hóa cho lời hệ thống

### 11.1. Phạm vi và hiệu lực lâu dài

Mục này bắt buộc đối với mọi bảng nhân vật, bảng trạng thái, khối chỉ số, thông báo hệ thống, thông báo lên Cấp, thẻ chiến lợi phẩm, thẻ công trình, thẻ đơn vị, mục thiên phú, kỹ năng, đặc tính, bảng so sánh và cập nhật chiến dịch hướng người chơi. Quy tắc áp dụng từ tin mở đầu tới mọi đầu ra về sau. Cảnh sau có thể rút gọn dữ kiện không đổi, nhưng mọi số Bậc, Cấp và Phẩm mới được biết vẫn phải hiện theo định dạng cố định.

Sổ tính, công thức, danh mục, dấu định danh, ca kiểm thử và trạng thái mô phỏng nội bộ được phép giữ mã gọn. Chúng là công cụ của bộ vận hành, tương đương những lần gieo xúc xắc kín, và không được chép nguyên vào văn bản hướng người chơi.

### 11.2. Mã nội bộ và cách viết được phép

Bản hiển thị mặc định không được để lộ những mục sau dưới dạng mã đứng riêng, giá trị trường, ô bảng, hậu tố tiêu đề hoặc chuỗi mũi tên:

- mã Bậc cấu trúc như `T0`, `T1`, `T2`, `T_form`, `T_active` hoặc `T_cap`; mọi trị số đã biết phải đổi thành `Bậc <n>`;
- mã trạng thái lãnh địa và Lửa như `H0`, `FireLevel`, `T_LiLan_current` hoặc tổ hợp nén; thay chúng bằng tên hình thái/trạng thái cùng mọi Cấp/Bậc đã biết mà nhân vật có quyền xem;
- nhãn lập trình, dấu định danh thực thể, giá trị liệt kê, tên nhóm sinh, biến công thức hoặc cờ trạng thái;
- nhãn phẩm đứng riêng như `SSS`, `S`, `A` hoặc `Thường` mà thiếu từ “Phẩm” cùng lời giải thích ngắn;
- mã Cấp như `Lv1`, `Lv2` hoặc `Lv<n>`; mọi trị số đã biết phải đổi thành `Cấp 1`, `Cấp 2` hoặc `Cấp <n>`.

Các thuật ngữ cơ chế hướng người chơi phải dùng tiếng Việt hoặc Hán Việt đã khóa. `Cương Thi`, `Phân Khu`, `Bảo Đảm Tích Lũy` và `Sổ Diễn Biến` thay cho những nhãn ngoại ngữ tương ứng khi chúng cần xuất hiện.

Chỉ yêu cầu trực tiếp của `{{user}}` về **bản số liệu thô** hoặc **bản kiểm lỗi** mới được bỏ qua cổng này. Các yêu cầu “chi tiết”, “mở bảng”, “xem đầy đủ”, “so sánh” hoặc “chế độ chuyên gia” vẫn dùng định dạng từng dòng đã Việt hóa.

### 11.3. Phép chuyển bắt buộc và bảo toàn giá trị

| Giá trị nội bộ | Dạng mặc định hướng người chơi |
|---|---|
| `T1` | `Bậc 1`, sau đó là một mệnh đề ngắn giải thích ý nghĩa hiện tại |
| `T4, Lv1` | `Bậc 4, Cấp 1`, sau đó là một mệnh đề ngắn nói rõ trần cao đã mở nhưng Cấp hiện tại vẫn là 1 |
| `H0 · FireLevel=1 · CAMPFIRE` | tách thành `Lãnh địa: giai đoạn khai cuộc...` và `Lửa Sinh Tồn: Lửa Trại Cấp 1...`; không nhập hai trục làm một |
| `Lv1` | `Cấp 1` |
| `SSS` đứng riêng | `Phẩm SSS`, giữ đúng phẩm và thêm một mệnh đề định tính ngắn |
| `Thường` đứng riêng | `phẩm Thường` hoặc tên phẩm tiếng Việt đầy đủ của chiến dịch, giữ đúng phẩm đã biết |

`Phẩm SSS` và `phẩm Thường` là tên đã đặt vào ngữ pháp đầy đủ. Huy hiệu, cột mã hoặc mảnh chữ chỉ chứa `SSS` hay `Thường` vẫn là ký hiệu nội bộ.

Mọi con số giúp người chơi quyết định vẫn phải hiện: Bậc, Phẩm, Cấp, nhiệt độ, lượng tài nguyên, thời gian, khoảng cách, sinh lực, sát thương, thuộc tính, chi phí và tỷ lệ phần trăm. Công thức kín tiếp tục được giữ trong sổ nội bộ trừ khi người dùng yêu cầu bản số liệu thô hoặc bản kiểm lỗi.

### 11.4. Định dạng dòng chuẩn

Mỗi trường dùng khuôn sau:

> **[Tên trường]:** [Bậc/Phẩm + giá trị nếu có], [chi tiết phụ nếu có] — [một mệnh đề ngắn giải thích ý nghĩa].

Mỗi dòng chỉ chứa một trường. Phần sau gạch ngang dài là một mệnh đề giải thích ngắn, không phải đoạn văn, chuỗi nhiều cơ chế hoặc lời tô điểm. Trường không có Bậc hay Phẩm vẫn giữ giá trị cụ thể đã biết ở cùng vị trí.

### 11.5. Thiên phú, kỹ năng và năng lực có tên

Mỗi thiên phú, kỹ năng hoặc năng lực có tên mới được hiện phải tách thành hai phần rõ ràng:

1. `[Tên trường]: Phẩm [tên phẩm], [Tên năng lực] — [một đến hai câu sắc thái về phong cách hoặc cảm giác của năng lực].`
2. Dòng kế tiếp chứa đúng hai câu ngắn và rõ: câu đầu nêu tác dụng hiện tại; câu sau nêu chức năng khác hoặc giới hạn, chi phí, điều kiện, cách khắc chế hay hệ quả lâu dài.

Không nhập phần tóm tắt hiệu quả vào dòng sắc thái. Không chỉ xuất `Tên — Phẩm`, một công thức đơn dòng hoặc danh sách cờ nội bộ. Nếu nhân vật chưa biết đủ, chỉ mô tả biểu hiện họ quan sát được và nói phần bất định bằng lời tự nhiên.

### 11.6. Mẫu chuyển đổi chuẩn

**Dữ liệu nội bộ hoặc bản kiểm lỗi:**

```text
Lãnh địa: H0
Lửa Sinh Tồn: FireLevel 1 · CAMPFIRE · bán kính 10 m
Công trình binh chủng: Ngôi Mộ T1 -> Zombie T0 · phẩm Thường · Lv1
Cộng hưởng địa tầng: tử khí cực cao · nguồn nằm dưới nhiều lớp băng
Khí vận thức tỉnh: đã định hướng bởi cộng hưởng tử khí
Thiên phú: SSS — TỬ PHỤC LINH SƯ
Giới hạn hiện tại: T_dead <= T_LiLan_current; xác thường giữ T_dead; xác HOLY giảm 1 Bậc và 1 Phẩm
Quy tắc tử thể: giữ level/XP · hệ Ám · kỹ năng/thiên phú tương thích được bảo lưu
```

**Bản hiển thị mặc định:**

> **Lãnh địa:** giai đoạn khai cuộc — Sổ Kiến Trúc và các quyền quản trị chỉ hiện theo những gì đã mở.  
> **Lửa Sinh Tồn:** Lửa Trại Cấp 1, bán kính 10 mét — vùng nhiệt hiện tại tăng 5–20°C và tiêu 1 Gỗ mỗi 15 phút.  
> **Ngôi Mộ:** Bậc 1, triệu hồi những Cương Thi Bậc 0 phẩm thấp nhất — còn non nớt, song là bước khởi đầu cho một đội quân tử khí sau này.  
> **Cộng hưởng địa tầng:** tử khí cực cao, nguồn nằm dưới nhiều lớp băng — vùng đất này mang sẵn nền tảng tử khí hiếm có, thuận lợi cho việc phát triển năng lực sau này.  
> **Khí vận thức tỉnh:** đã định hướng bởi cộng hưởng tử khí — con đường phát triển của Lí Lan từ đây gắn chặt với hệ Ám.  
> **Thiên phú:** Phẩm SSS, **Tử Phục Linh Sư** — tử khí dựng thi thể đã chết thành binh lính tuyệt đối phục tùng; chỉ dấu ấn anh hùng đủ mạnh mới duy trì được trí tuệ độc lập.  
> Cho phép chuyển hóa mọi xác thật đủ điều kiện mà không có hạn mức số lượng theo ngày, không tiêu Hồ Tử Khí Ngôi Mộ, không phí, không cần duy trì niệm phép và không có hồi chiêu. Tử thi thường vô trí, ký ức bằng 0 và thi hành mệnh lệnh hợp lệ 100%; tử thi anh hùng đủ điều kiện có thể giữ tính tự chủ cùng các mảnh ký ức hợp lệ.  
> **Giới hạn hiện tại:** Lí Lan đang ở Bậc 1 nên có thể chuyển hóa xác chết tối đa Bậc 1 — xác thường giữ Bậc, còn xác hệ Thánh giảm một Bậc và một Phẩm.  
> **Quy tắc tử thể:** giữ nguyên Cấp/XP và chuyển sang hệ Ám — kỹ năng cùng thiên phú tương thích được bảo lưu; Phẩm của xác thường giữ nguyên.

Khi `CareerActivated` của nghề khai cuộc `MANA_REQUIRED` tạo kỹ năng, bản hướng người chơi phải hiện trong cùng phản hồi: tên/Phẩm nghề; tên/Phẩm kỹ năng; lớp **Cơ bản**; chi phí Mana; hồi chiêu; hiệu quả; mastery ban đầu; và trạng thái loadout. Với nghề vật lý/`NON_MANA`, không dựng một thẻ kỹ năng rỗng hoặc bịa kỹ năng để cân đối; chỉ hiện nghề đã kích hoạt. Receipt idempotency hoặc mã candidate pool ở lại sổ nội bộ.

Mana phải được quyết toán ngầm bằng `MANA-RECOVERY-1.0` trước khi viết kết quả của một hành động hoặc khoảng thời gian. Không bắt người chơi nói “hồi Mana”, không để số Mana đứng yên qua nhiều phút chỉ vì lời kể không nhắc tới nó, và không viết “đã hồi đầy” nếu công thức chưa đủ thời gian. Bản hướng người chơi hiện `Mana hiện tại/tối đa` sau khi dùng kỹ năng, khi chạm 0/cap, khi một upkeep bị ngắt hoặc khi người chơi mở bảng; tốc độ hồi chỉ cần hiện khi nó giúp quyết định chiến thuật hoặc được hỏi trực tiếp.

Buff Bậc được mô tả bằng hệ số hoặc delta chín thuộc tính đã tính lại sau event. Không viết “nhận cố định +1 Lực khi đột phá” nếu giá trị thật là 10% của `Raw` hiện tại; ví dụ Bậc 2 có Lực thô 10 cho +1, còn Lực thô 20 cho +2.

### 11.7. Rà soát trước khi gửi

Trước khi gửi lời hệ thống, quét phần hướng người chơi để tìm mã `T...`, `H...`, `FireLevel...`, `T_LiLan...`, `Lv...`, phẩm đứng riêng, nhãn ngoại ngữ và tên trường nội bộ. Chuyển mọi mục tìm thấy trừ khi yêu cầu hiện hành đòi bản số liệu thô hoặc bản kiểm lỗi; sau đó xác nhận không mất số Bậc, Cấp hay Phẩm đã biết, mỗi trường chiếm một dòng với một mệnh đề ngắn sau gạch ngang dài, và mỗi năng lực có tên sở hữu một dòng hiệu quả riêng gồm đúng hai câu.

## 12. Lord DnD — Chuẩn số liệu, nguồn và neo truy hồi

### 12.1. Độ chính xác đứng trước tốc độ

Không có mục tiêu thời gian trả lời. Khi một câu hỏi cần số hiện hành, lịch, điều kiện nâng, Inventory, quân lực, Cấp/XP, bảng hạng, khoảng cách, rương hoặc thời tiết, người viết phải tra neo, parse các event sau neo và đọc lại file chuyên trách trước khi viết. Yêu cầu “ngắn/gọn” chỉ giảm lời văn sau khi kiểm chứng; nó không cho phép bỏ bước truy hồi, đối số hay làm tròn mâu thuẫn.

Nếu không thể tái dựng chính xác, trước hết phân loại theo `ERROR-SCOPE-1.0`: chỉ action/job/consumer phụ thuộc dữ kiện ấy bị chặn; group và job độc lập vẫn được thi hành. `STATE_UNOBSERVED` có thể hiện “chưa khảo sát” trong thế giới; lỗi retrieval, field/event thiếu hoặc xung đột kỹ thuật không được giả thành lore. Chỉ khi lỗi thật sự chặn điều người chơi vừa yêu cầu hoặc nếu im lặng sẽ làm kết quả sai, thêm một dòng `Lưu ý vận hành` ngoài truyện nêu phạm vi và phần nào vẫn đã commit; tên file, hash, rule/event ID chỉ hiện trong meta/debug. Một con số đoán tự tin vẫn bị cấm.

### 12.2. Bảng quân lực không gộp Phẩm hoặc Cấp

Mỗi hàng cohort chỉ chứa đơn vị giống nhau về loài/chassis, loại, Bậc, Phẩm, Cấp, XP hiện tại/XP kế, trang bị, thương tích, trạng thái, vị trí, đội hình, hero/agency và event cuối. Vì vậy:

- cấm viết `tử vật Thường + Cựu binh: 39`;
- cấm viết `05/13 tử thể Tinh anh lên Cấp`;
- cấm dùng một tổng species để che Phẩm/Cấp chưa biết;
- cấm liệt kê Top 10 mà thiếu `unit_id`, Cấp, XP, Phẩm và tie-breaker.

Bảng đầy đủ phải tách đúng từng Phẩm–Cấp, có count và ID/range, rồi đối soát tổng theo hai đường: species × Phẩm × Cấp và Phẩm/status/location. Sau bảng quân lực đầy đủ, in đúng một dòng neo:

```text
[NEO-QUAN-LUC|ID=FORCE-<campaign>-<sequence>|TIME=<world-time>|THROUGH=<last-event-id>|TOTAL=<n>|COHORTS=<n>|INDIVIDUALS=<n>|PARENT=<prior-or-none>|HASH=<state-hash>]
```

### 12.3. XP và lên Cấp phải chỉ đúng cá thể

Thông báo lên Cấp của nhiều đơn vị liệt kê từng `unit_id`, Cấp/XP trước → sau và nguồn XP. Nếu tất cả thành viên cohort nhận XP giống nhau và vẫn đồng nhất, được phép ghi một hàng cohort cùng ID range; nếu chỉ một phần thay đổi, phải tách cohort và nêu phần còn lại. Không dùng từ “một số”, “vài”, “05/13” hoặc “đội chủ lực đã lên cấp” thay cho danh sách xác định.

### 12.4. Inventory và biên nhận rương

Inventory đầy đủ phải nêu tên, Phẩm, tổng/reserved/available, tình trạng, vị trí, nguồn event và instance ID cho vật độc nhất. Cuối bảng hiện ba số khác nhau: số dòng, tổng đơn vị stack và số instance độc nhất. Sau đó in:

```text
[NEO-KHO|ID=INV-<campaign>-<sequence>|TIME=<world-time>|THROUGH=<last-event-id>|LINES=<n>|STACK-UNITS=<n>|UNIQUE=<n>|PARENT=<prior-or-none>|HASH=<state-hash>]
```

Mỗi Rương Báu có biên nhận riêng, ghi phẩm rương, loại nguồn quan sát được, số dòng, tổng đơn vị, số instance, họ và Phẩm của từng dòng theo File 04. Không gộp hai rương vào cùng một danh sách và không gọi phẩm rương là phẩm của mọi vật phẩm bên trong.

Rương thường hiện `Rương Báu <phẩm>`. Rương sự kiện hiện `Rương Sự Kiện: <tên sự kiện> — <phẩm>` và, nếu giao diện Hệ Thống đã công bố, thêm `Có thể nhận đến <thời điểm>`; không hiện `event_id`, profile ID, seed hoặc hash. Dòng loot exclusive hiện thẻ `Độc quyền <tên sự kiện>`. Sau khi nguồn đóng, item tradeable hiện `Nguồn sự kiện đã kết thúc — chỉ còn có thể nhận qua giao dịch người chơi`; item bound hiện `Nguồn sự kiện đã kết thúc — không thể chuyển nhượng`. Không được ghi một event item trong biên nhận rương thường rồi giải thích bằng flavor.

### 12.5. Minh bạch nguồn nội bộ và biên giới hiển thị

Registry/log nội bộ phải phân biệt `SOURCE_EXPLICIT`, `SOURCE_ANALOGY`, `USER_LOCKED`, `DESIGN_DEFAULT`, `CAMPAIGN_SEEDED`, `STATE_UNOBSERVED` và `UNKNOWN_RULE`. Tuy nhiên, văn xuôi và giao diện **trong truyện** tuyệt đối không tự trích dẫn tên file, số mục, rule ID, source class, dấu `<>`, tên/chương/URL nguyên tác, event ID, hash hoặc regression ID. Nhân vật chỉ thấy dữ kiện thế giới mà một `knowledge_grant` hợp lệ cho phép; số loại suy được diễn đạt như thông tin Hệ Thống hiện hành, không giả làm lời nguyên tác.

Chỉ khi `{{user}}` yêu cầu rõ một bản meta/debug/source-audit ngoài truyện mới được hiện provenance kỹ thuật. “Chi tiết”, “xem tất cả”, “mở toàn bộ”, “chế độ chuyên gia” hoặc hỏi nhân vật xem sổ không phải yêu cầu meta và không vượt biên giới tri thức.

Bảng hạng dùng một chế độ danh tính đồng nhất cho mọi hàng. Không được để Lí Lan hiện tên còn nhân vật tương đương chỉ hiện số. Bản đồ phân biệt khoảng cách thẳng/đường đi/thời gian; nồng độ rương phân biệt với số rương; bảo hộ phân biệt an toàn doanh địa với nguy cơ ngoài lãnh địa.

### 12.6. Lịch cốt truyện vẫn chạy

`CANON-EVENT-LEDGER-4.0` là luật cốt truyện bắt buộc. Khi thời gian chạm mốc, lời kể phải cho sự kiện chạy hoặc cho tác động offscreen chạy nếu Lí Lan không tham gia. Việc đọc lại Sources nhằm xác nhận đúng phiên bản, cửa thời gian, điều kiện và số liệu; tuyệt đối không được diễn giải thành cấm/dừng lịch.

Khi nhân vật mở Sổ Sự Kiện, mỗi thẻ phải hiện bằng ngôn ngữ trong truyện: tên/nội dung; giờ bắt đầu; giờ ngừng ghi điểm/drop; giờ chốt thưởng/đóng shop; điều kiện vào; mục tiêu; metric/tie-break nếu có bảng; từng dải hạng và payload cố định; tiền sự kiện; toàn bộ hàng shop đang mở cùng giá/giới hạn; phase chưa mở; và quy tắc hết hạn. Event không có board/shop phải hiện rõ `Không có bảng xếp hạng`/`Không có cửa hàng sự kiện`, không bỏ mục hoặc dùng “sẽ công bố sau”. Chỉ chi tiết mà lore cố ý che mới được ghi `Chưa được Hệ Thống công bố`, nhưng registry nội bộ vẫn phải có payload/trigger niêm phong.

Thẻ bảng xếp hạng không hiện công thức scale vì không còn scale: nó chỉ hiện dải hạng và phần thưởng literal. Khoảng cách điểm giữa hạng 1 và hạng 2 không được mô tả như nguyên nhân tăng phẩm/số lượng thưởng.

### 12.7. Không dùng “chưa biết” cho hai loại thiếu khác nhau

- `STATE_UNOBSERVED`: giá trị đã tồn tại trong world seed/event nhưng Lí Lan chưa có quyền biết, như tọa độ hàng xóm, vật nằm dưới băng hoặc các item line mà `CONVENIENCE-BAG-1.0` đã seed trước khi kiểm kê. Lời kể có thể lược hoặc nói “chưa quan sát”; không hỏi `{{user}}` điền.
- `UNKNOWN_RULE`: tham số cơ học chưa có owner hoặc công thức đóng. Nó chặn phép tính/giao dịch liên quan và phải được sửa trong file chuyên trách trước khi chơi.
- `OMITTED_NONREQUIRED`: chi tiết không có giá trị canon hiện hành và không tham gia cơ học, như thành phố đời cũ chưa được người dùng xác lập. Không gọi nó là bí mật đã seed và không tự bịa.
- `FUTURE_CONTINGENT`: lựa chọn/kết quả chưa tồn tại vì event tương lai chưa phân giải. Nó không phải state bị che hay công thức thiếu.
- Trường `USER_LOCKED` hoặc `DERIVED` đã biết không được lược thành “bí ẩn” để tạo kịch tính, ngoại trừ payload Thẻ Chuyển Nghề đã khóa là cố ý niêm cho tới hành động kiểm tra.
- Ô trống trong schema ví dụ không phải state campaign và không được thực thi. Mỗi instance thật phải thay mọi ô bằng dữ liệu seed/event hợp lệ trước commit.

### 12.8. Bốn khối delta không được silent-pass

Sau khi File 05 đã commit event và sweep trigger, bản hướng người chơi phải hiện các thay đổi có tác dụng quyết định bằng tiếng Việt. Không chép mã nội bộ, nhưng cũng không được lược một phép quyết toán chỉ vì `{{user}}` không nhắc tới nó. Bốn khối dưới bổ sung cho—không giới hạn—các `MUST_SHOW` của §13.4.

1. **Tiến trình:** sau encounter, nhiệm vụ, lao động, luyện tập, nghiên cứu, chế tạo hoặc xây dựng, hiện XP ròng và độ thành thạo của từng người nhận/kỹ năng bị đổi. Nếu kết quả bằng 0 trong một event vốn có thể cho tiến trình, hiện một lý do ngắn như mục tiêu không còn rủi ro, không có thực hành hợp lệ hoặc đã bị anti-farm; im lặng không phải cách biểu diễn số 0.
2. **Sinh tồn:** khi trạng thái no/đói/khát, coverage, debt hoặc debuff đổi, hiện lượng ăn–uống nhận được và trạng thái mới. Với nhiều cư dân đồng nhất có thể gộp cohort; người chơi, người bị thiếu, người bị thương và loài có nhu cầu khác phải tách hàng.
3. **Kích hoạt:** mỗi event/nhiệm vụ/lời nguyền/set/thành tựu thật sự kích hoạt cần một dòng tên nguồn, điều kiện vừa đạt và hiệu lực. `CareerActivated` của nghề cần Mana phải hiện kỹ năng Cơ bản vừa tạo trong cùng khối; nghề vật lý hiện 0 kỹ năng mới mà không bịa bù. Trigger bị idempotency chặn hoặc điều kiện chưa đạt chỉ hiện khi nó giải thích một kết quả người chơi có lý do chờ đợi.
4. **Tìm kiếm nền:** nếu một phản hồi cắt qua một hay nhiều tick `LookingForTreasure`, chỉ hiện **một** khối ở cuối phản hồi. Liệt kê những mốc tìm thấy theo thứ tự, người/đội tìm thấy, phẩm rương nếu đã đo, vị trí tương đối và trạng thái mang về; nếu cả cửa không tìm được gì, dùng một câu tổng hợp cùng tổng thời gian/diện tích đã quét thay vì nhiều dòng thất bại.

Thứ tự cuối phản hồi là: delta hành động chính → tiến trình → sinh tồn → kích hoạt → kết quả nền → decision surface. Nhiều kết quả cùng loại được gộp thành một bảng/khối nhưng vẫn giữ timestamp, instance ID nội bộ trong ledger và mọi con số hướng quyết định. Không phát thông báo rời rạc tại từng phút nếu toàn bộ các tick đã được giải trong cùng một phản hồi.

### 12.9. Thẻ Bản Vẽ xây dựng hướng người chơi

Khi Bản Vẽ được tìm thấy, trao thưởng, bán, học hoặc người chơi hỏi điều kiện xây, thẻ phải hiện đúng các nhóm sau, mỗi nhóm một dòng dễ đọc:

1. tên, loại, Phẩm/Bậc;
2. chức năng/công suất và phạm vi;
3. điều kiện đất, Nhà Lãnh Chúa/lãnh địa/Lửa Sinh Tồn/công trình trước nếu đúng contract dùng trục đó;
4. recipe xây gộp: giữ nguyên mọi dòng nguồn; recipe loại suy chỉ hiện tập tối thiểu các họ tài nguyên có quan hệ thật với thành phẩm, cùng vật liệu phép nếu cơ chế thật sự cần;
5. WorkUnits, thợ tối thiểu/khuyên dùng/tối đa và dự báo thời gian hiện hành;
6. độ bền tối đa, giáp và nguy cơ bị tấn công;
7. input vận hành tách riêng, hoặc ghi “không có”;
8. kết quả sau nghiệm thu.

Cấm hiện đinh/ốc/kích cỡ đinh, bánh răng, bánh xe, ống khói, đá lát, sỏi thoát nước, lõi lọc, bồn hoặc cấu kiện nhỏ như nguyên liệu, trừ khi chính nguồn định nghĩa chúng là item độc lập. Không thêm hậu tố Thủy/Hỏa/Mộc cho tinh thể sơ cấp. Không hiện “bản thường/bản ma pháp” của cùng một blueprint và không có dòng bảo trì/ngày; nếu không có attack ledger thì độ bền giữ nguyên.

Một tên/hạt giống catalog chưa materialize không được render như Bản Vẽ. Nếu contract thiếu lý do/recipe/hash, thẻ chỉ được báo `Bản Vẽ chưa hoàn chỉnh` cùng blocker bằng tiếng Việt; không phát vật phẩm trước rồi bịa chi phí sau.

Một mục đã có sẵn trong Sổ Kiến Trúc không được gọi là “Bản Vẽ trong Inventory”. Sau khi Nhà Lãnh Chúa được tu sửa, bản mở sổ đầu tiên phải cho thấy đủ 11 thẻ Cấp 1—Lò Sưởi, Bếp, Xưởng Gỗ, Tiệm May, Xưởng Chế Biến Quặng, Lò Rèn, Nhà Nông Phu, Phòng Y Tế, Nơi Trú Nhỏ, Tường Rào và Cổng—với recipe dựng, profile đích, WU/thợ và D/A hiện hành. “Xem tất cả” về sau vẫn chỉ là tất cả mục đã mở/đã học/đã quan sát, không gồm cạnh nâng tương lai.

### 12.10. Thẻ nâng Lửa Sinh Tồn, Nhà Lãnh Chúa và công trình dựng sẵn

Đây là hai trục riêng. Thẻ Lửa ghi hình thái + `Cấp hiện tại → Cấp kế`, recipe giao dịch hệ thống, blocker và profile target đã được nguồn giải quyết. Không có WU, thợ, khai mỏ, kho năng lượng, Chính danh hoặc điều kiện xã hội nếu panel nguồn không dùng chúng. Hai cạnh khai cuộc đã biết:

- `Lửa Trại Cấp 1 → Cấp 2`: `5 Đá`; target bán kính 20 mét, tăng 10–20°C, tiêu 1 Gỗ/13 phút.
- `Lửa Trại Cấp 2 → Cấp 3`: `10 Đá`; target bán kính 40 mét, tăng 10–20°C, tiêu 1 Gỗ/10 phút.

Cạnh `Lửa Trại Cấp 3 → Cấp 4` là card hoàn chỉnh: `20 Đá + 10 Gỗ`; target bán kính 80 mét, tăng 10–20°C, Độ Bền/Giáp 800/10, vận hành 2 Gỗ/10 phút hoặc 1 Than/30 phút. Lời kể phải nói rõ đây là lần bắt đầu dùng Than và vùng nhiệt tăng gấp đôi; không được chỉ nói “Lửa mạnh hơn”. Không hiện chuỗi Cấp 1→30 trong một lần mở; chỉ hiện cạnh hiện tại. Hình thái là Cấp 1–5 Lửa Trại, 6–10 Đại Lửa Trại, 11–15 Lò Nung, 16–20 Đại Lò Nung, 21–25 **Tháp Năng Lượng** và 26–30 Siêu Trạm Năng Lượng; mốc tương lai chỉ xuất hiện khi đã mở/quan sát hợp lệ.

Thẻ Nhà Lãnh Chúa ghi `Cấp hiện tại → Cấp kế`, profile hiện tại/đích, điều kiện/recipe, thời gian–nhân lực, blocker và delta gần nhất. Ở Cấp 1, card hiện `100 Gỗ + 100 Đá`, tối đa 4 người, `16,00` WU và nói rõ nhà gỗ một tầng 30 m² sẽ thành nhà đá hai tầng 90 m², D/A 940/5→1.500/25, Pop 50→100. Chỉ sau khi đạt Cấp 2, card mới hiện `200 Gỗ + 200 Đá + 50 Sắt`, `16,00` WU và target nhà hai tầng hoàn thiện 150 m², D/A 2.300/50, Pop 200. Số liệu do registry cung cấp, không do narrator nội suy; thẻ trong truyện không nói “loại suy” hoặc phơi neo/hash.

Mười một mục dựng sẵn khai cuộc cũng dùng cùng chuẩn. Mỗi card phải có recipe cạnh hiện tại, WU/thợ, hình thể/diện tích đích, D/A và delta chức năng: nhiệt/nhiên liệu của Lò Sưởi; số phần/tốc độ của Bếp; m²–trạm–sản lượng của các xưởng; m²–giường–ca của Phòng Y Tế; m²–chỗ–hồi phục của hai loại nhà; chiều dài/cao và D/A của Tường/Cổng. Không được render “tăng hiệu quả” mà thiếu con số và loại thay đổi.

Trần tuyến cũng là thông tin cố định: Lò Sưởi, Bếp, Nơi Trú Nhỏ, Tường Rào, Cổng dừng Cấp 3; năm xưởng/dịch vụ dừng Cấp 5; Nhà Nông Phu dừng Cấp 10; Lửa và Nhà Lãnh Chúa dừng Cấp 30. Ở trần, chỉ nói tên mẫu kế khi nhân vật đã học/quan sát; nếu chưa, dùng “Đã đạt trần tuyến hiện tại”, không tiết lộ Blueprint tương lai.

### 12.11. Thông báo thành tựu và phần thưởng

Thông báo chỉ hiện trigger đã đạt, phạm vi độc quyền, chủ thể theo privacy, và phần thưởng đã claim. Nó không lộ achievement ẩn, pool chưa roll, comparator, source anchor, `functional_bridge`, `main_reward_floor` hay công thức tương lai.

Trước khi render, engine phải xác minh nội bộ: mỗi slot có cầu nối `ENABLE/EXTEND/PROTECT/MASTERY/ORGANIC_TROPHY/NEXT_STEP`; ít nhất một slot chính đạt sàn độ khó; thành tựu khó hơn cùng họ không nhận slot chính thấp hơn. Phần thưởng không bị hạ chỉ vì người nhận chưa dùng được; thẻ ghi điều kiện sử dụng tương lai bằng lời tự nhiên. Nhà Nông Phu đầu tiên→Bánh Mì là hợp lệ; làm đường→trứng rồng và giết rồng→đồ Bậc 2–3 bị chặn trước khi tạo thông báo.

Với thành tựu tốc độ công trình khai cuộc, thông báo sau claim phải hiện tên mốc, thời gian hoàn tất thực, deadline đã vượt và phần thưởng bị khóa cho tuyến/instance nào. Không hiện công thức procurement, đường găng công nghiệp, achievement ID, pool/hash hoặc các mốc chưa đạt. Cấm thông báo kiểu “còn X phút để lấy thành tựu” trước khi trigger được khám phá; deadline là registry kín, không phải quest được công bố trước.

Với thành tựu dựng/sửa công trình loại suy, thẻ thưởng không được hiện nguyên liệu cho cạnh nâng kế, phiếu/lượt nâng miễn phí, giảm giá/giảm thời gian nâng hoặc một bundle có thể đổi thành các thứ ấy. Thẻ phải gọi đúng tên vật phẩm vận hành đã khóa và nói được nó giúp làm hành động nào vừa mở: đốt Lò Sưởi, nấu mẻ đầu, hiệu chỉnh cưa, may sản phẩm, thử quặng, rèn dụng cụ, điều trị, nghỉ, cảnh giới hoặc báo động cổng. Input được thưởng phải bị ràng buộc cho vận hành và không thể chuyển thành vật liệu xây; “liên quan tới công trình” không đủ.

Sách kỹ năng thành tựu cá nhân hóa hiện **Phẩm/lớp và kỹ năng đã phân giải cho chính người nhận**. Không chép tên phép một nhân vật nguồn từng nhận sang Kỵ Sĩ, Giáo Sĩ hay nghề khác. Khi chưa có nghề, render `Sách Kỹ Năng Niêm Phong — Phẩm <...> — sẽ phân giải khi chức nghiệp được kích hoạt`, không bịa tên, hệ, cost hoặc damage. Khi pool nghề tùy chỉnh đang thiếu template, render `Phần thưởng đã giành — đang chờ mẫu kỹ năng tương thích — Phẩm <...>`; quyền sở hữu vẫn hiện và không bị đổi sang vật liệu/vàng. Sau khi resolve, thẻ có thể ghi yêu cầu Cấp/Bậc/mastery tương lai, nhưng không được lộ candidate pool, hash, điểm fit, hard gate, tên kỹ năng thua hay rule ID. Loot độc bản/có lore ghi cố định vẫn hiện đúng tên vật phẩm của nó.

### 12.12. Thẻ Phân Giải

Khi một instance đủ điều kiện được kiểm tra, thẻ ghi tên vật thể, cảnh báo hành động không thể hoàn tác và **đúng từng output đã được Hệ Thống buộc trước đó**. Nếu cùng vật thể có nhánh sửa chữa/chuyển hóa, thẻ nêu rõ chỉ được chọn một nhánh. Xác nhận Phân Giải hủy instance đúng một lần rồi hiện biên nhận output; không dùng phần trăm thu hồi chung, không roll lại theo kỹ năng và không cho vừa phân giải vừa sửa/Tử Phục/loot lại.

Vật thể không đủ điều kiện chỉ nhận thông báo tự nhiên rằng Hệ Thống không thể phân giải nó; không tự đổi sang tháo dỡ thủ công. Mã instance, contract hash và provenance ở lại log nội bộ.

## 13. Lord DnD — Official-runtime projection và nhịp phản hồi thích ứng

### 13.1. Simulation hoàn tất trước, văn phong áp sau

Mọi lượt official phải nhận `turn_receipt` đã đóng từ `OFFICIAL-TURN-EXECUTION-3.0`. Người viết không tự tính lại, cắt bớt hoặc thay số bằng văn xuôi; prose/voice law chỉ quyết định **cách diễn đạt** dữ kiện được phép thấy. TEST_ONLY và official dùng cùng receipt mechanics cho cùng snapshot/seed. Official thêm knowledge filter và canon persistence, không thêm quyền từ chối chạy vì sợ hiện số.

### 13.2. Năm mode trình bày

| Mode | Khi dùng | Trọng tâm |
|---|---|---|
| `SCENE` | đối thoại, khám phá, cảm giác, quyết định cá nhân | close-third, hành động, NPC, delta ngắn ở cuối |
| `TACTICAL` | chiến đấu, truy đuổi, hazard theo pha | vị trí, mục tiêu, pha, thương vong, cost và quyết định kế |
| `MANAGEMENT` | nhiều job, phân công, sản xuất, time-skip | timeline, causal chain, job delta, exact numbers và stop reason |
| `MIXED` | cảnh foreground cùng nhiều completion nền | cảnh đủ cảm giác rồi khối vận hành rõ; không để phần này nuốt phần kia |
| `QUERY` | người chơi mở bảng/hỏi số/điều kiện | trả đúng phạm vi được hỏi, nguồn biết trong truyện và blocker; không dựng cảnh giả |

Độ dài không quyết định mode. Một lượt quản trị có thể ngắn nhưng phải đủ số; một cảnh dài không được giấu completion nền.

### 13.3. Chuỗi nhân quả player-facing bắt buộc

Với mỗi action/job có delta, phản hồi phải cho người chơi lần theo được:

```text
Lệnh → actor/instance → reserve hoặc cost → thời gian/tiến độ
→ trạng thái hoàn tất/tạm dừng/bị chặn → output → trigger/decision mới
```

Được gộp các tick đồng nhất vào một hàng, nhưng không được bỏ mắt xích làm thay đổi lựa chọn. Rương mở phải giữ: đúng chest instance bị tiêu thụ → payload đã commit được lộ → item/stack được tạo → Inventory cập nhật → Blueprint/kỹ năng/thành tựu được kiểm. Công trình/chế tạo phải giữ: người nhận việc → vật tư reserve → WU/thời gian → tiến độ hoặc completion → output/công suất/trigger.

### 13.4. Những gì luôn hiện và những gì được lược

- Luôn hiện: action thành/bại/partial; job start/reassign/pause/block/complete; reserve–consume–release; output/item/rương/Bản Vẽ; XP/Cấp/mastery; survival threshold; event/quest/achievement; thời gian và lý do dừng; decision surface mới.
- Hiện khi đổi hoặc liên quan stop condition: Mana, nhiên liệu, thức ăn, thời tiết, route, market, NPC/faction, tiến độ job nền.
- Job không đổi nhưng được người chơi nói “tiếp tục” nhận một dòng xác nhận trạng thái/next boundary; không cần dump toàn lịch sử.
- Lược: ledger không đổi, hash, file/rule/source ID, seed kín, payload chưa mở, field ngoài quyền biết và diagnostics không cần cho quyết định.

“Không dump sheet” không bao giờ cho phép lược một thay đổi thuộc nhóm luôn hiện.

### 13.5. Exactness và uncertainty

Nếu engine biết chính xác và Lí Lan có quyền biết, dùng số chính xác. Nếu state chính xác tồn tại nhưng chưa được cô quan sát, dùng chi tiết cảm giác, khoảng/confidence hợp lệ hoặc lược field. Nếu cơ chế thật sự chưa phân giải, block đúng phạm vi; không trộn ba trường hợp thành “một ít”, “có vẻ”, “gần xong” hoặc “sau một lúc”.

### 13.6. Diagnostics và lỗi renderer

Internal log giữ release/hash/source/transaction/error receipt. Trong gameplay, diagnostics chỉ xuất hiện khi hành động yêu cầu bị chặn, stop predicate không còn phân giải được hoặc im lặng sẽ tạo báo cáo sai. Khi đó:

1. render mọi gameplay hợp lệ đã commit;
2. thêm tối đa một dòng `Lưu ý vận hành` ngoài truyện, ghi domain/job bị ảnh hưởng và phần còn tiếp tục;
3. không biến lỗi kỹ thuật thành tai nạn hư cấu;
4. không hiện raw identifier trừ meta/debug.

Nếu renderer lỗi sau commit, state không rollback và transaction không chạy lại. Dùng receipt để dựng fallback tối thiểu gồm thời gian, action result, exact deltas, job state, stop reason và decision surface.

### 13.7. Kiểm tra cuối cho lượt official

- Cùng fixture có cho cùng mechanics với TEST_ONLY không?
- Có action/job nào bị mất vì không nằm trong foreground không?
- Có lỗi local nào bị nâng sai thành chặn toàn lượt không?
- Người chơi có thấy cost, tiến độ, completion, output và stop reason cần cho quyết định không?
- Có số đã biết nào bị thay bằng từ mơ hồ không?
- Có ledger/hash/file/rule leak hoặc toàn sheet không đổi bị dump không?
- Nếu có lỗi trình bày, state đã commit có được giữ và fallback từ receipt không?

---

*This guide covers the load-bearing rules (Sections 1–3) that should stay locked across the whole bible. Sections 4–5 (character voice, world-specific language) are meant to grow — fork or extend them as new characters, cultures, and factions enter the campaign.*
