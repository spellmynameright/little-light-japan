// A Little Light — the five-city journey.
// Cities, community projects, the local people who become elders, practical
// Japanese situations, and the finale. Pure data: no DOM, loadable in Node.
(function (root) {
  'use strict';

  // Each city: where you live, what season it is, what you learn there, the three
  // local people you meet (index 0 = teacher, 1 = listener, 2 = host — the order
  // matters because each appointed elder strengthens Japanese / culture / connection),
  // three community projects, and the gift you carry forward.
  const cities = [
    {
      name: 'Tokyo', jp: '東京', district: 'Hanamimachi', districtJp: '花見町',
      tag: 'A place to begin', side: null, mult: 1, color: '#427c62',
      goal: 1e11,
      season: 'Spring · a neighborhood waking up',
      theme: 'Learn to receive before you lead.',
      arrival: 'A suitcase, a key on a paper tag, and a stairwell that smells of someone else’s miso soup. The cherry trees along the lane have just begun. Nobody here is waiting for you — and somehow that makes it easier to begin.',
      letter: 'Mrs. Sato has put your name beside hers on the kitchen rota. You are no longer the visitor with a plan. You are a neighbor who can be counted on.',
      gift: 'The welcome book', effect: 'Study and language exchange earn 25% more Japanese insight.',
      locals: [
        { name: 'Yui', jp: '結衣', role: 'Linguistics student', seal: '教', color: '#8b92b4',
          bio: 'Twenty-one, always carrying a notebook. She came to the exchange to study “natural speech” and keeps staying for the conversation.',
          meet: 'Yui is the last to leave the language exchange, still writing. “Your mistakes are very regular,” she says, delighted. “That means they can be fixed.” She shows you a page of her own English errors. It is longer than yours.',
          stages: [
            'You ask Yui why she studies languages. “Because every word is somebody’s way of noticing,” she says. You spend an hour on the word 木漏れ日 — sunlight through leaves — and neither of you is in a hurry.',
            'Yui starts arriving early to set out name cards. When a nervous newcomer freezes, she switches to slow, simple Japanese without being asked. Later she admits she used to be that newcomer.',
            'She asks to lead the reading of a psalm at supper, in both languages. Afterward she says, “I didn’t know a translation could feel like a prayer.” You did not tell her what to say. She found it.'
          ],
          appoint: 'Yui will teach — carefully, slowly, kindly. “I’ll make the mistakes so they don’t have to,” she jokes. She means: I will go first.' },
        { name: 'Daisuke', jp: '大輔', role: 'Office worker', seal: '聴', color: '#7d8f86',
          bio: 'Thirty-four. Works long hours in an office near the station. Formal, tired, and far kinder than he lets anyone see.',
          meet: 'Daisuke nearly walks into you at the corner shop, apologizes three times, and then — unexpectedly — stays. He buys two cans of hot coffee from the machine and hands you one. “You looked cold,” he says, as if that explains everything.',
          stages: [
            'You learn that Daisuke eats dinner at his desk most nights. You don’t offer advice. You save him a seat at the table, and when he arrives at 9 p.m., the soup is still warm.',
            'Daisuke notices who is missing. “The old man from the third floor hasn’t come for two weeks.” He visits on the way home, still in his suit. He comes back quieter, and grateful.',
            'He asks you about his father, who was always at work. You listen for a long time. At the end he says, “Maybe faithfulness is just showing up. Again and again.” You think he is right.'
          ],
          appoint: 'Daisuke will listen. He keeps a small notebook of names and what each person is carrying. He apologizes for being so “salaryman” about it — and everyone is cared for.' },
        { name: 'Naomi', jp: '直美', role: 'Night-shift nurse', seal: '和', color: '#bd8f87',
          bio: 'A nurse and a mother of two, who seems to know the location of every spare chair in Hanamimachi.',
          meet: 'Naomi arrives at the open table with a pot of curry and two sleepy children. “I heard there was a table,” she says. “I brought something for it.” By the end of the evening she has rearranged the chairs, and the room works better.',
          stages: [
            'Naomi teaches you that hospitality is mostly logistics done with love: enough cups, warm rice, a chair by the door for whoever arrives late and embarrassed.',
            'After a hard shift she sits very still at the table. You don’t ask her to help. You pour her tea. “It’s strange,” she says, “being the one who is cared for.”',
            'Naomi asks how you decide who to invite. You realize you don’t; the table decides. She nods slowly. “Then I’ll keep setting one extra place.”'
          ],
          appoint: 'Naomi will host. She has already set out the bowls for next week, and one extra.' }
      ],
      projects: [
        { name: 'The neighborhood welcome book', landmark: 'board',
          text: 'Mrs. Sato wants a simple guide for the next person who arrives bewildered. Walk the local route with her, then write down what you learn.',
          tasks: [[0, 40, 'study sessions'], [1, 24, 'local errands']], reward: 90, side: 'culture', amount: 8,
          done: 'The guide includes your own first mistakes. Mrs. Sato adds a hand-drawn map. The next arrival will not have to figure out everything alone.' },
        { name: 'A table for conversation', landmark: 'terrace',
          text: 'Emi offers a quiet corner after the lunch rush. Prepare a language exchange where everyone gets to be both learner and teacher.',
          tasks: [[2, 30, 'café conversations'], [3, 24, 'language exchanges']], reward: 150, side: 'bonds', amount: 12,
          done: 'Someone laughs at their own mistake; everyone relaxes. Emi writes the next meeting on her calendar. The invitation no longer depends on you.' },
        { name: 'A supper that carries on', landmark: 'lanterns',
          text: 'The neighbors want to take turns cooking. Prepare the first suppers together and make space for prayer and questions afterward.',
          tasks: [[4, 50, 'shared meals'], [3, 36, 'language exchanges']], reward: 240, side: 'bonds', amount: 20,
          done: 'Naomi sets out the bowls. Daisuke greets a late arrival. You realize the evening has begun without anyone asking you what to do next.' }
      ]
    },
    {
      name: 'Kanazawa', jp: '金沢', district: 'Hikari-chō', districtJp: 'ひかり町',
      tag: '×1.5 cultural understanding', side: 'culture', mult: 1.5, color: '#8b8b69',
      goal: 4e12,
      season: 'Autumn · rain on the canal',
      theme: 'Make room for beauty and questions.',
      arrival: 'The canal runs beside the lane, and the old wooden houses lean together like people sharing an umbrella. Maple leaves stick to the wet stones. You know more Japanese than when you first arrived in Tokyo — and still not nearly enough.',
      letter: 'Haru sends a photograph of the reading room. A child has moved the lamp again. The room belongs to the people who use it, and the stories are still opening windows.',
      gift: 'A shelf of windows', effect: 'Story evenings and the community garden earn 25% more cultural understanding.',
      locals: [
        { name: 'Ren', jp: '蓮', role: 'Gold-leaf artisan', seal: '教', color: '#b89455',
          bio: 'A young craftsman who beats gold leaf so thin that light comes through it. Patient with materials; impatient with himself.',
          meet: 'Ren shows you a sheet of gold leaf on a bamboo frame. “Breathe too hard and it’s gone,” he says. You hold your breath. He laughs — the first time you hear him laugh — and the leaf trembles but holds.',
          stages: [
            'Ren builds shelves for the reading room from offcuts. He measures four times. “The wood has already decided what it wants to be,” he says. “I’m just learning to listen.”',
            'He reads aloud at story evening for the first time. His voice shakes. A child corrects his pronunciation of a dragon’s name. The room laughs, and Ren laughs with them, and something in him unclenches.',
            'Ren asks you how to explain grace to someone who has only ever earned things. You don’t have a neat answer. Together you look at the gold leaf: something given, so thin the light comes through.'
          ],
          appoint: 'Ren will teach — the way he learned his craft: slowly, by doing it together, with room for mistakes.' },
        { name: 'Sachiko', jp: '幸子', role: 'Retired shopkeeper', seal: '聴', color: '#8b9faf',
          bio: 'She ran the paper shop by the canal for forty years. She knows every name on the street and most of their sorrows.',
          meet: 'Sachiko walks you along the canal, naming each shop and who runs it, who used to run it, and who is ill. By the bridge she stops. “People say this street is dying,” she says. “It isn’t. It’s just tired.”',
          stages: [
            'Sachiko teaches you to visit without an agenda. You sit in a tatami room for an hour with a widower who talks about carp. On the way home she says, “That was good work.”',
            'She asks what you pray for. You tell her honestly. She is quiet. The next week she says, “I prayed too. I don’t know who to. But I prayed for the man with the carp.”',
            'Sachiko starts bringing people to the reading room — not to the stories, at first, just to the warmth. “A room is an invitation,” she says. “Words come later.”'
          ],
          appoint: 'Sachiko will listen. Forty years behind a shop counter taught her how; something newer has taught her why.' },
        { name: 'Mika', jp: '美香', role: 'Teacher and mother', seal: '和', color: '#c5825f',
          bio: 'An elementary-school teacher who brings her whole class’s energy home with her, and somehow still has some to share.',
          meet: 'Mika invites you to supper after hearing you are “the foreigner with the reading room.” Her kitchen is chaos. Her children quiz you on kanji. You fail; they are thrilled. You are invited back.',
          stages: [
            'Mika shows you how she plans a supper for twenty on a teacher’s salary: rice, a big pot, and asking people what they can bring. “Nobody wants to be a guest forever,” she says.',
            'A neighbor criticizes the story evenings — “religious propaganda.” Mika listens without arguing, then invites him to choose next week’s book. He chooses a book about the sea. He stays.',
            'Mika asks if she is “good enough” to lead anything. You remind her of the man who chose the book about the sea. She is quiet, and then she laughs. “Grace is very inconvenient,” she says.'
          ],
          appoint: 'Mika will host. She keeps the kettle on and the questions honest.' }
      ],
      projects: [
        { name: 'Listen along the canal', landmark: 'board',
          text: 'Sachiko takes you along the water to meet the shopkeepers. Learn names and listen to what people hope this street might become.',
          tasks: [[1, 40, 'neighborhood errands'], [2, 36, 'conversations over tea']], reward: 90, side: 'culture', amount: 12,
          done: 'The names on your map become people with histories. Sachiko suggests a room where those stories could be shared.' },
        { name: 'Open the reading room', landmark: 'terrace',
          text: 'Ren brings shelves. Haru lends books. Prepare stories that welcome wonder, questions, and children who cannot sit still.',
          tasks: [[3, 40, 'language exchanges'], [5, 44, 'story evenings']], reward: 150, side: 'culture', amount: 20,
          done: 'A picture book lies beside a Gospel and a book of poems. Nobody has to pretend they understand everything to join the conversation.' },
        { name: 'An evening of shared stories', landmark: 'lanterns',
          text: 'Mika invites the street to supper and a reading. Work together so the room can keep its welcome after you leave.',
          tasks: [[4, 64, 'shared meals'], [5, 64, 'story evenings']], reward: 240, side: 'bonds', amount: 25,
          done: 'Ren reads while Mika keeps an eye on the kettle. A difficult question is met with patient attention. The room has learned how to listen.' }
      ]
    },
    {
      name: 'Sendai', jp: '仙台', district: 'Komorebi-chō', districtJp: '木漏れ日町',
      tag: '×1.5 connection growth', side: 'bonds', mult: 1.5, color: '#609188',
      goal: 4e13,
      season: 'Summer · shade beneath the trees',
      theme: 'Shared care grows deep roots.',
      arrival: 'Zelkova trees arch over the street, and the cicadas are so loud they feel like weather. Paper streamers hang outside the shops for Tanabata. Some of the older neighbors moved here from the coast, years ago. They do not talk about it much.',
      letter: 'A basket arrives with a note: “Too many vegetables again.” Below it are names you recognize and several you do not. The circle has grown wider.',
      gift: 'Seeds to share', effect: 'Café visits, shared meals, and fellowship earn 25% more connection.',
      locals: [
        { name: 'Sōta', jp: '颯太', role: 'High-school biology teacher', seal: '教', color: '#659a85',
          bio: 'He found a neglected patch of ground behind the apartments and cannot stop thinking about what it could become.',
          meet: 'Sōta is crouched over a weedy lot with a soil-test kit. “Too much clay,” he announces, as though this is good news. “Clay holds water. It just needs patience.” He offers you a trowel before your name.',
          stages: [
            'Sōta teaches the garden team the names of things: the beetles, the weeds worth keeping, the fungus that helps roots find water. “Nothing grows alone,” he says. “Not even the weeds.”',
            'His students start coming on Saturdays. One of them, angry at everything, spends an hour building a compost bin and leaves almost smiling. Sōta says nothing about it. He just saves the boy a pair of gloves.',
            'He asks you about the parable of the sower. “Why does the farmer throw seed on the path?” You talk for a long time about a generosity that doesn’t calculate. He writes something in his notebook.'
          ],
          appoint: 'Sōta will teach — patiently, from the ground up. He has already labeled the seed packets for whoever comes next.' },
        { name: 'Keiko', jp: '恵子', role: 'Home visitor', seal: '聴', color: '#a593ad',
          bio: 'She moved inland after the 2011 tsunami. She knows how much a knock on a door can matter.',
          meet: 'Keiko has a list of neighbors who rarely come outside. She does not explain why she keeps it. “Would you carry this?” she asks, handing you a pot of soup. You follow her up four flights of stairs.',
          stages: [
            'Keiko teaches you which doorbell is broken and who prefers a quiet visit. “Don’t bring answers,” she says. “Bring soup. Answers go cold.”',
            'One evening she tells you about the water, and the house that is no longer there, very simply, without tears. Then she asks you to pray. You do, haltingly, in Japanese. She corrects one word, gently.',
            'Keiko says she was angry at God for a long time. “I still am, sometimes. But I keep visiting people. I think maybe He does too.”'
          ],
          appoint: 'Keiko will listen. She carries a list of names, and now a few other people carry it with her.' },
        { name: 'Nana', jp: '奈々', role: 'Runs the corner bakery', seal: '和', color: '#d4a064',
          bio: 'She bakes melon-pan at four in the morning and gives away the day-old bread at four in the afternoon.',
          meet: 'Nana presses a bag of day-old bread into your arms. “For your supper thing,” she says. “Everyone is talking about your supper thing.” She is clearly hoping to be invited.',
          stages: [
            'Nana turns the harvest supper into an event: bread shaped like wheat sheaves, a sign-up sheet, a box for prayer requests that she pretends not to read and then prays for anyway.',
            'The bakery has a bad month. Nana stops coming to supper, embarrassed. The garden team brings her vegetables and stays to help clean the ovens. She cries into a bag of flour and then laughs at herself.',
            'Nana asks whether a church can meet in a bakery. You tell her the early church met in houses and markets and wherever people shared bread. She looks at her shop as if seeing it for the first time.'
          ],
          appoint: 'Nana will host. The harvest supper will happen every year, and nobody will be charged for bread.' }
      ],
      projects: [
        { name: 'A place at the bench', landmark: 'board',
          text: 'Keiko wants the neighborhood meals to include people who find it hard to come out. Learn the routes and make time to listen.',
          tasks: [[1, 50, 'local errands'], [2, 40, 'café conversations']], reward: 90, side: 'bonds', amount: 12,
          done: 'You learn which doorbell is broken and who prefers a quiet visit. Care begins to have names and addresses.' },
        { name: 'Prepare the shared garden', landmark: 'terrace',
          text: 'Sōta has found a neglected patch of ground. Kenji sends seeds from Tokyo; the neighbors bring ideas. Tend the beds and share the work.',
          tasks: [[6, 24, 'garden sessions'], [4, 44, 'shared meals']], reward: 150, side: 'culture', amount: 25,
          done: 'The first shoots are unimpressive and somehow wonderful. People who barely spoke now have something to care for together.' },
        { name: 'The harvest belongs to everyone', landmark: 'lanterns',
          text: 'Nana wants the harvest supper to become a regular gathering. Prepare the food and help the local team carry the invitations.',
          tasks: [[6, 32, 'garden sessions'], [4, 60, 'shared meals']], reward: 240, side: 'bonds', amount: 30,
          done: 'A prayer of thanks names the rain, the soil, and the hands that helped. There is enough to send a bowl to someone who could not come.' }
      ]
    },
    {
      name: 'Sapporo', jp: '札幌', district: 'Akari-chō', districtJp: '灯町',
      tag: '×1.15 all XP earnings', side: 'xp', mult: 1.15, color: '#7c9eb0',
      goal: 2e14,
      season: 'Winter · warm windows in the snow',
      theme: 'Keep a light on through the cold.',
      arrival: 'Snow to your knees and a sky the color of milk. The streets run in a straight grid, and every doorway has a little vestibule to keep the cold out. The neighborhood is called Akari-chō — “lamp town.” You take this personally.',
      letter: 'Yōko writes that the kettle broke and Daichi fixed it. There is no grand news, only a page full of names and ordinary kindness. You read it twice.',
      gift: 'A light in winter', effect: 'All activities earn 20% more XP, permanently.',
      locals: [
        { name: 'Daichi', jp: '大地', role: 'Snowplow driver', seal: '教', color: '#7c9eb0',
          bio: 'Works nights clearing roads. Large, quiet, and able to fix anything that has a screw in it.',
          meet: 'At 5 a.m. a snowplow stops outside the house and the driver climbs down to shovel your doorstep by hand. “The machine can’t reach,” Daichi says, and drives off before you can thank him.',
          stages: [
            'Daichi fixes the broken kettle, the sticky door, and the heater that clicks. He never mentions it. You start leaving him onigiri on the step; he starts leaving the containers washed.',
            'He suggests a story evening for the long nights. When you ask him to read, he refuses. Then he tells — not reads — a story about his grandfather and a bear, and the room is spellbound.',
            'Daichi asks why Jesus washed feet. “That’s a servant’s job,” he says, frowning. Then, slowly: “Ah. That’s the point.” He doesn’t say anything else for a while.'
          ],
          appoint: 'Daichi will teach — mostly by example, occasionally with a story about a bear.' },
        { name: 'Yōko', jp: '洋子', role: 'Retired librarian', seal: '聴', color: '#798f78',
          bio: 'She keeps a list of neighbors who would enjoy company, written in beautiful handwriting, updated every Sunday.',
          meet: 'Yōko’s list has forty-one names on it. She shows it to you as if confessing something. “Winter is long,” she says. “Some people don’t speak to anyone from December to March.”',
          stages: [
            'Yōko teaches you the winter routines: whose pipes freeze, who needs their steps salted, which widow will refuse help unless it is disguised as a request for advice.',
            'You visit a man who has not spoken to anyone in three weeks. He talks for two hours. Walking home through the snow, Yōko says, “You see? A light doesn’t have to be big. It just has to be on.”',
            'Yōko wonders aloud whether she believes enough to belong. You read her the story of the man who said, “I believe; help my unbelief.” She asks you to mark the page.'
          ],
          appoint: 'Yōko will listen. Her list has grown to sixty names, and now it has many hands.' },
        { name: 'Rina', jp: '里奈', role: 'Graphic designer', seal: '和', color: '#9b83ab',
          bio: 'Moved back from Tokyo to care for her mother. Organized, funny, and a little lonely.',
          meet: 'Rina redesigns your hand-drawn flyer without asking, then apologizes, then admits she was bored. The new flyer is beautiful. Twice as many people come.',
          stages: [
            'Rina organizes the house: a rota, a shared calendar, a shelf labeled “things people left behind.” Order, it turns out, is a kind of welcome.',
            'Her mother’s memory is failing. Rina comes to supper exhausted. The others take turns sitting with her mother so she can rest. “I didn’t know a church did this,” she says. “Neither did I, at first,” you say.',
            'Rina asks what happens when you leave. You tell her honestly: the house will become theirs. She is quiet. Then she pulls out a notebook and begins to plan.'
          ],
          appoint: 'Rina will host. The calendar is full, the kettle is fixed, and the door stays open.' }
      ],
      projects: [
        { name: 'A warm welcome', landmark: 'board',
          text: 'Yōko keeps a list of neighbors who would enjoy company. Learn the winter routines and arrange a regular afternoon over tea.',
          tasks: [[1, 50, 'local errands'], [2, 44, 'tea conversations']], reward: 90, side: 'culture', amount: 15,
          done: 'The snow has made the street quieter, but not every home is quiet by choice. A dependable invitation begins to matter.' },
        { name: 'Stories for long evenings', landmark: 'terrace',
          text: 'Daichi suggests a weekly meal and story evening. Prepare a place where questions and homesickness can be spoken aloud.',
          tasks: [[4, 60, 'shared meals'], [5, 56, 'story evenings']], reward: 150, side: 'bonds', amount: 25,
          done: 'Someone stays to talk after the story. Someone else washes up. There is no hurry to turn the lights off.' },
        { name: 'Keep the house open', landmark: 'lanterns',
          text: 'Rina offers to organize the house with the local elders. Equip it, welcome people, and practice sharing responsibility.',
          tasks: [[7, 20, 'fellowship gatherings'], [4, 60, 'shared meals']], reward: 240, side: 'bonds', amount: 35,
          done: 'You arrive late and find the windows glowing. Rina waves you toward an empty chair. Tonight, you get to receive the welcome.' }
      ]
    },
    {
      name: 'Fukuoka', jp: '福岡', district: 'Asahi-chō', districtJp: '朝日町',
      tag: '×1.5 Japanese learning', side: 'jp', mult: 1.5, color: '#c09573',
      goal: 8e14,
      season: 'Late summer · sea air at the harbor',
      theme: 'A beginning you do not have to own.',
      arrival: 'Salt air, gulls, and food stalls glowing along the river at night. People here speak fast and warmly in Hakata dialect, and laugh at your Tokyo-textbook Japanese — kindly. You are, once again, a beginner. You are getting better at being one.',
      letter: 'From five cities come five ordinary letters: a story, a recipe, a question, a photograph, an invitation. The work was never a monument to the person who began it. It is life shared, and life continuing.',
      gift: 'A shared journey', effect: 'All learning and relationship gains increase by 20%, permanently.',
      locals: [
        { name: 'Mariko', jp: '真理子', role: 'Japanese teacher for newcomers', seal: '教', color: '#c09573',
          bio: 'Teaches Japanese to factory workers from Vietnam, Nepal, and the Philippines. Her classroom is always too small.',
          meet: 'Mariko introduces you to a newcomer from Vietnam whose Japanese is as uncertain as yours once was. “You’ll understand him,” she says. “You remember.” You do.',
          stages: [
            'Mariko teaches you to teach: slowly, with pictures, celebrating every right answer as if it were a small miracle. “It is a small miracle,” she says.',
            'Her students start coming to supper. Seven languages around one table. Nobody understands everything; everybody understands the rice. Mariko watches, and you see her blink hard.',
            'Mariko asks whether God speaks Japanese. You tell her about Pentecost — every person hearing in their own language. She asks you to read it in Vietnamese for her student. Your pronunciation is terrible. He weeps anyway.'
          ],
          appoint: 'Mariko will teach. Every newcomer will be welcomed by someone who remembers being new.' },
        { name: 'Hana', jp: '花', role: 'Florist', seal: '聴', color: '#bd8f87',
          bio: 'Runs a flower shop by the harbor. Knows which flowers mean what, and when people buy them.',
          meet: 'Hana knows who in the neighborhood is grieving, because they buy white chrysanthemums. “I can’t do anything,” she says. “I just wrap them well.” You think that is not nothing.',
          stages: [
            'Hana teaches you to notice: who buys flowers for a birthday, who for a hospital, who for no reason at all. You begin, very quietly, to pray for the customers.',
            'A young mother buys funeral flowers and cannot pay. Hana gives them, then closes the shop and walks with her to the temple. Later she asks you, “Was that right?” You tell her yes.',
            'Hana asks to be baptized in the sea. It is cold and the waves are rude and everyone is laughing and crying at once. She comes up shouting something in Hakata dialect that you do not catch.'
          ],
          appoint: 'Hana will listen. She will know the keys’ weight, and she will carry them gently.' },
        { name: 'Yūta', jp: '悠太', role: 'Runs a yatai food stall', seal: '和', color: '#b89455',
          bio: 'Serves ramen from a stall by the river until 2 a.m. Has strong opinions about broth and gentle ones about people.',
          meet: 'Yūta’s stall has eight stools. He has a regular for each one, and saves a bowl for the late shift. “Sit,” he says, “you look like a person who forgets to eat.” He is right.',
          stages: [
            'Yūta explains how a yatai works: small, temporary, packed up every night and built again every evening. “Like a tent,” you say. He likes that.',
            'He invites his regulars to the harbor table. A taxi driver, a nurse, two students, a man who sleeps at the station. Yūta serves them all first, then sits down last.',
            'Yūta asks whether a church needs a building. You look at his stall, at the eight stools, at the steam rising into the night. “Not always,” you say. He nods, satisfied.'
          ],
          appoint: 'Yūta will host. There will always be a bowl saved for the late shift.' }
      ],
      projects: [
        { name: 'Welcome the next arrival', landmark: 'board',
          text: 'Mariko introduces a newcomer whose Japanese is as uncertain as yours once was. Help with the words and listen before offering a plan.',
          tasks: [[0, 76, 'study sessions'], [3, 50, 'language exchanges']], reward: 90, side: 'jp', amount: 20,
          done: 'You recognize the tired smile of someone translating every sentence. You leave time for the reply.' },
        { name: 'The harbor table', landmark: 'terrace',
          text: 'Yūta wants a regular meal for neighbors with very different schedules. Prepare the table and a place for conversation afterward.',
          tasks: [[4, 60, 'shared meals'], [2, 60, 'café conversations']], reward: 150, side: 'bonds', amount: 25,
          done: 'Not everyone stays for the reading. Everyone is still welcome at supper. Yūta saves a plate for the late shift.' },
        { name: 'Leave the keys in good hands', landmark: 'lanterns',
          text: 'Hana and the elders are ready to carry the life of the house. Share the final gatherings, then let their plans become their own.',
          tasks: [[7, 24, 'fellowship gatherings'], [5, 50, 'story evenings']], reward: 240, side: 'culture', amount: 35,
          done: 'Hana takes the keys, then asks whether you will stay for tea. Being no longer needed to run the room does not mean you no longer belong.' }
      ]
    }
  ];

  // Practical Japanese. `city` limits a situation to one city (dialect); the rest are anywhere.
  const situations = [
    { at: 0, title: 'The first morning', scene: 'Mrs. Sato greets you on the stairs. It is morning. Which greeting fits?', jp: 'おはようございます。', romaji: 'Ohayō gozaimasu.', options: ['Good morning.', 'Thank you for the meal.', 'See you tomorrow.'], answer: 0, note: 'A polite morning greeting. You can begin a conversation with just this.', side: 'jp' },
    { at: 5, title: 'A bag of vegetables', scene: 'Mrs. Sato gives you cucumbers from her garden. How do you thank her politely?', jp: 'ありがとうございます。', romaji: 'Arigatō gozaimasu.', options: ['Where is the station?', 'Thank you.', 'Please come again.'], answer: 1, note: 'Arigatō gozaimasu is a polite way to express thanks.', side: 'bonds' },
    { at: 20, title: 'At the café', scene: 'You want to ask Emi for water. What are you requesting?', jp: 'お水をお願いします。', romaji: 'Omizu o onegai shimasu.', options: ['The bill, please.', 'A book, please.', 'Water, please.'], answer: 2, note: 'Omizu means water. Onegai shimasu makes this a polite request.', side: 'jp' },
    { at: 40, title: 'Words passing too quickly', scene: 'Your neighbor is speaking faster than you can follow. What does this request mean?', jp: 'もう一度お願いします。', romaji: 'Mō ichido onegai shimasu.', options: ['One more time, please.', 'Please come tomorrow.', 'I understand everything.'], answer: 0, note: 'You can ask someone to repeat themselves. Learning does not require pretending to understand.', side: 'culture' },
    { at: 60, title: 'Finding your way', scene: 'You are going to meet a language partner. What are you asking?', jp: '駅はどこですか。', romaji: 'Eki wa doko desu ka.', options: ['What time is dinner?', 'Where is the station?', 'Is this your book?'], answer: 1, note: 'Eki means station; doko means where.', side: 'jp' },
    { at: 100, title: 'Making room', scene: 'Someone hesitates beside the empty chair at your table. What does your invitation mean?', jp: 'どうぞ、座ってください。', romaji: 'Dōzo, suwatte kudasai.', options: ['Please wait outside.', 'Please bring a chair.', 'Please, have a seat.'], answer: 2, note: 'Dōzo can offer permission or an invitation. Here it accompanies “please sit.”', side: 'bonds' },
    { at: 130, title: 'The first shared meal', scene: 'You hear this just before everyone begins eating. What is happening?', jp: 'いただきます。', romaji: 'Itadakimasu.', options: ['An expression said before eating.', 'A request for more food.', 'A goodbye after supper.'], answer: 0, note: 'Itadakimasu is commonly said before a meal. It does not literally mean “this is delicious.”', side: 'culture' },
    { at: 240, title: 'The busy kitchen', scene: 'Your neighbor is carrying plates. What are you offering?', jp: '手伝いましょうか。', romaji: 'Tetsudaimashō ka.', options: ['Shall we go home?', 'Shall I help?', 'Shall I read?'], answer: 1, note: 'Ask what would help and make room for the answer.', side: 'bonds' },
    { at: 400, title: 'A shared harvest', scene: 'Kenji thanks everyone who helped the garden grow. What does this phrase acknowledge?', jp: 'おかげさまで。', romaji: 'Okagesama de.', options: ['I did it all myself.', 'The work is unfinished.', 'Things have gone well with others’ help.'], answer: 2, note: 'The phrase acknowledges help or support rather than claiming all the credit.', side: 'culture' },
    { at: 650, title: 'Leave an invitation', scene: 'A guest is leaving the fellowship house. What are you saying?', jp: 'また来てください。', romaji: 'Mata kite kudasai.', options: ['Please come again.', 'Please close the window.', 'Please teach me tomorrow.'], answer: 0, note: 'Mata means again. The invitation remains open.', side: 'bonds' },
    { at: 180, title: 'The end of a long day', scene: 'Daisuke comes in late from work. Someone at the table greets him with this. What are they saying?', jp: 'お疲れ様です。', romaji: 'Otsukaresama desu.', options: ['You must be tired — thank you for your hard work.', 'You are late again.', 'Please go home and rest.'], answer: 0, note: 'Otsukaresama is a warm acknowledgement of someone’s effort. It is said at work, after events, and to anyone who has had a long day.', side: 'bonds' },
    { at: 0, city: 1, title: 'Kanazawa hospitality', scene: 'Sachiko sets a plate of sweets in front of you and says this in Kanazawa dialect. What does she mean?', jp: '食べまっし。', romaji: 'Tabemasshi.', options: ['Please, eat.', 'Don’t touch these.', 'I made these myself.'], answer: 0, note: 'In Kanazawa dialect, 〜まっし is a gentle, polite way of urging someone: “please do.” Standard Japanese would say 食べてください.', side: 'culture' },
    { at: 0, city: 2, title: 'Sendai agreement', scene: 'You say the garden looks good. Sōta nods and answers in Sendai dialect. What is he saying?', jp: 'んだっちゃ。', romaji: 'Ndaccha.', options: ['That’s right, isn’t it.', 'It needs more water.', 'I don’t think so.'], answer: 0, note: '〜だっちゃ is a famous feature of Sendai dialect, softening a statement like “you know” or “isn’t it.”', side: 'culture' },
    { at: 0, city: 3, title: 'A Hokkaido morning', scene: 'Daichi stamps the snow off his boots and says this. What is he telling you?', jp: 'しばれるねえ。', romaji: 'Shibareru nē.', options: ['It’s freezing, isn’t it.', 'It’s finally warm.', 'The road is closed.'], answer: 0, note: 'しばれる is Hokkaido dialect for bitter, biting cold. You will hear it often from December to March.', side: 'culture' },
    { at: 0, city: 4, title: 'Hakata curiosity', scene: 'Yūta looks up from his broth and asks you this in Hakata dialect. What is he asking?', jp: 'なんしよっと？', romaji: 'Nanshiyotto?', options: ['What are you doing?', 'Are you hungry?', 'Where are you from?'], answer: 0, note: 'Hakata dialect often ends questions with 〜と. Standard Japanese would say 何をしているの？', side: 'culture' }
  ];

  // The finale: read as a short sequence of cards after the fifth church is entrusted.
  const finale = [
    { title: 'Five letters', text: 'From Tokyo, a recipe with tea stains. From Kanazawa, a pressed maple leaf. From Sendai, a seed packet labeled in a biology teacher’s handwriting. From Sapporo, sixty names. From Fukuoka, a photograph of eight stools by a river.' },
    { title: 'What you carried', text: 'You began with a suitcase and a handful of words. You were given cucumbers, a spare key, a recipe, a chair by the window. You learned that receiving is not the opposite of serving. It is where serving begins.' },
    { title: 'What you left', text: 'Fifteen people you once did not know now care for one another without you. Not one of the churches bears your name. You find that you are glad.' },
    { title: 'The light stays on', text: 'It was never your light. You were only asked to carry it a little way, and to set it where others could see — and they did, and they lit their own. Somewhere tonight, in five cities, a kettle is on.' }
  ];

  const api = { cities, situations, finale };
  if (typeof module !== 'undefined') module.exports = api;
  else root.Journey = api;
})(typeof window !== 'undefined' ? window : globalThis);
