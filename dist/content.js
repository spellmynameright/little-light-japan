// A Little Light — words, lessons, the kana notebook, and the Tokyo neighbors.
// Pure data: loads as window.Content in the browser and via require() in Node.
(function (root) {
  'use strict';

  // [japanese, romaji, meaning, Japanese insight needed to see it].
  // Order matters: saves store learned words by index. Only ever append.
  const WORDS = [
    ['こんにちは', 'konnichiwa', 'Hello', 0], ['ありがとう', 'arigatō', 'Thank you', 0], ['はい', 'hai', 'Yes', 0], ['いいえ', 'iie', 'No', 0],
    ['すみません', 'sumimasen', 'Excuse me / sorry', 20], ['おはようございます', 'ohayō gozaimasu', 'Good morning', 20], ['水', 'mizu', 'Water', 20], ['お茶', 'ocha', 'Tea', 20],
    ['駅', 'eki', 'Station', 60], ['本', 'hon', 'Book', 60], ['友達', 'tomodachi', 'Friend', 60], ['どうぞ', 'dōzo', 'Please / go ahead', 60],
    ['いただきます', 'itadakimasu', 'Said before eating', 130], ['おいしい', 'oishii', 'Delicious', 130], ['一緒に', 'issho ni', 'Together', 130], ['大丈夫', 'daijōbu', 'Okay / all right', 130],
    ['手伝いましょうか', 'tetsudaimashō ka', 'Shall I help?', 240], ['また明日', 'mata ashita', 'See you tomorrow', 240], ['教会', 'kyōkai', 'Church', 240], ['希望', 'kibō', 'Hope', 240],
    ['おかげさまで', 'okagesama de', 'Thanks to you / others', 400], ['お互い様', 'otagaisama', 'We help each other', 400], ['居場所', 'ibasho', 'A place to belong', 400], ['平和', 'heiwa', 'Peace', 400],
    ['ゆっくりでいいですよ', 'yukkuri de ii desu yo', 'Take your time', 650], ['お会いできてうれしいです', 'oai dekite ureshii desu', 'I’m glad to meet you', 650], ['また来てください', 'mata kite kudasai', 'Please come again', 650], ['お元気ですか', 'ogenki desu ka', 'How are you?', 650],
    // 28+ — added with the lesson book.
    ['さようなら', 'sayōnara', 'Goodbye', 0], ['おやすみなさい', 'oyasuminasai', 'Good night', 0], ['はじめまして', 'hajimemashite', 'Nice to meet you (first time)', 0], ['よろしくお願いします', 'yoroshiku onegai shimasu', 'I look forward to knowing you', 0],
    ['お願いします', 'onegai shimasu', 'Please (a request)', 20], ['ごめんなさい', 'gomen nasai', 'I’m sorry', 20], ['わかりません', 'wakarimasen', 'I don’t understand', 20], ['もう一度', 'mō ichido', 'One more time', 20],
    ['コーヒー', 'kōhī', 'Coffee', 20], ['ケーキ', 'kēki', 'Cake', 20], ['いくらですか', 'ikura desu ka', 'How much is it?', 20], ['甘い', 'amai', 'Sweet', 20],
    ['どこ', 'doko', 'Where', 60], ['右', 'migi', 'Right', 60], ['左', 'hidari', 'Left', 60], ['電車', 'densha', 'Train', 60],
    ['公園', 'kōen', 'Park', 60], ['お隣さん', 'otonari-san', 'Next-door neighbor', 60], ['ゴミ', 'gomi', 'Rubbish', 60], ['鍵', 'kagi', 'Key', 60],
    ['ごちそうさまでした', 'gochisōsama deshita', 'Said after eating', 130], ['ご飯', 'gohan', 'Rice / a meal', 130], ['お箸', 'ohashi', 'Chopsticks', 130], ['楽しい', 'tanoshii', 'Fun / enjoyable', 130],
    ['大変', 'taihen', 'Tough / hard going', 240], ['頑張って', 'ganbatte', 'Hang in there', 240], ['無理しないで', 'muri shinaide', 'Don’t overdo it', 240], ['助かります', 'tasukarimasu', 'That really helps', 240],
    ['祈り', 'inori', 'Prayer', 240], ['神様', 'kamisama', 'God', 240], ['聖書', 'seisho', 'The Bible', 240], ['恵み', 'megumi', 'Grace / blessing', 240],
    ['家族', 'kazoku', 'Family', 400], ['心', 'kokoro', 'Heart', 400], ['光', 'hikari', 'Light', 400], ['赦す', 'yurusu', 'To forgive', 400],
    ['お疲れ様でした', 'otsukaresama deshita', 'Thank you for your hard work', 650], ['いつもありがとう', 'itsumo arigatō', 'Thanks for always being there', 650], ['待っています', 'matte imasu', 'I’ll be waiting', 650], ['さびしい', 'sabishii', 'Lonely / missing someone', 650]
  ];

  // Ten short lessons. Each opens when you have enough Japanese insight to meet its words.
  const LESSONS = [
    { id: 'hello', jp: 'あいさつ', title: 'First words', words: [0, 1, 2, 3, 28, 29, 30, 31] },
    { id: 'polite', jp: 'ていねいに', title: 'Asking politely', words: [4, 5, 32, 33, 34, 35, 6, 1] },
    { id: 'cafe', jp: 'きっさてん', title: 'At the café', words: [7, 36, 37, 38, 39, 6, 32, 1] },
    { id: 'town', jp: 'まち', title: 'Around town', words: [8, 9, 40, 41, 42, 43, 44, 10] },
    { id: 'home', jp: 'となり', title: 'Neighbors and home', words: [45, 46, 47, 11, 10, 4, 29, 28] },
    { id: 'table', jp: 'しょくたく', title: 'At the table', words: [12, 48, 49, 50, 14, 13, 51, 15] },
    { id: 'help', jp: 'てつだい', title: 'Lending a hand', words: [16, 52, 53, 54, 55, 17, 15, 14] },
    { id: 'faith', jp: 'いのり', title: 'Words of faith', words: [18, 19, 56, 57, 58, 59, 11, 14] },
    { id: 'belong', jp: 'いばしょ', title: 'Belonging', words: [20, 21, 22, 60, 61, 62, 63, 23] },
    { id: 'friends', jp: 'ともだち', title: 'Long friendships', words: [24, 25, 26, 64, 65, 66, 67, 27] }
  ];

  // The study notebook fills in as your character studies.
  const HIRAGANA = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';
  const KATAKANA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
  const KANJI = '日本人水茶駅友家光心愛和山川木花雨雪空海町道店食飯本手口目耳話読書学先生今朝昼夜春夏秋冬';

  // The Tokyo neighbors. `place` is where they spend most of their time.
  const PEOPLE = [
    { id: 'sato', name: 'Mrs. Sato', jp: '佐藤さん', role: 'Your neighbor', seal: '里', color: '#98a57b', hair: '#c9c7bb', place: 0, needs: 0,
      partner: 'Local guide: errands earn 20% more culture' },
    { id: 'emi', name: 'Emi', jp: 'えみ', role: 'Café owner', seal: '恵', color: '#c5947a', hair: '#4d3830', place: 2, needs: 20,
      partner: 'Tea host: café connection +20%' },
    { id: 'haru', name: 'Haru', jp: 'はる', role: 'Bookshop assistant', seal: '春', color: '#8b9faf', hair: '#2f2a26', place: 5, needs: 60,
      partner: 'Reading partner: story evenings earn 20% more culture' },
    { id: 'kenji', name: 'Kenji', jp: 'けんじ', role: 'Community gardener', seal: '健', color: '#91a177', hair: '#77776b', place: 6, needs: 130,
      partner: 'Garden partner: garden culture +20%' },
    { id: 'aiko', name: 'Aiko', jp: 'あいこ', role: 'Local church host', seal: '愛', color: '#a593ad', hair: '#493931', place: 7, needs: 20,
      partner: 'Shared hospitality: meals and fellowship connection +20%' }
  ];
  // Connection needed for each of a neighbor's four stories.
  const STORY_AT = [0, 20, 60, 140];

  // Stories. `at` is the Japanese insight needed to understand the phrase without help.
  // `gains[i]` is what choice i adds. `echo` adds a line recalling an earlier choice.
  const stories = {
    emi: [
      { title: 'The cup you didn’t order', jp: 'どうぞ。', en: 'Please, go ahead.', at: 60,
        text: 'You hesitate at the café doorway, still rehearsing your introduction. Emi brings a cup of barley tea before you find the words. “You’re the new neighbor upstairs, aren’t you?” Today, being welcomed comes before being useful.',
        choices: ['Thank her, and ask her name.', 'Admit that your Japanese is a work in progress.'],
        responses: ['She writes her name on a napkin, then leaves space for yours. A small beginning.', '“Then we can practice,” she says. “I’m learning how to keep the basil alive. We both need patience.”'],
        gains: [{ bonds: 3 }, { jp: 3 }],
        note: 'A little bow and a simple greeting can be enough. You don’t have to perform fluency to be present.' },
      { title: 'The lunchtime rush', jp: '手伝いましょうか。', en: 'Shall I help?', at: 240,
        echo: { stage: 0, lines: ['The napkin with your two names is pinned beside the register.', 'The basil on the windowsill is, against all odds, still alive.'] },
        text: 'A sudden rain sends half the street into the café. Emi is carrying too many things. You could help, but this is her workplace; being eager isn’t the same as knowing what is needed.',
        choices: ['Ask what would actually help.', 'Offer to keep the waiting guests company.'],
        responses: ['“These cups, please.” One ordinary task, done well. She teaches you where everything belongs.', 'You sit with an older guest. By the time the rain stops, you have learned his dog’s name.'],
        gains: [{ culture: 3 }, { bonds: 3 }],
        note: 'Ask before stepping into someone’s work. Thoughtfulness includes respecting their way of doing things.' },
      { title: 'An empty chair', jp: '一緒に。', en: 'Together.', at: 130,
        echo: { stage: 1, lines: ['You know where the cups belong now. You put them away without being asked.', 'The older guest and his dog wave at you through the window as they pass.'] },
        text: 'After closing, Emi tells you that her mother used to sit by the window. You look at the empty chair. There is no clever sentence that could make this loss smaller.',
        choices: ['Stay and listen.', 'Ask what her mother loved about this place.'],
        responses: ['The kettle clicks off. Neither of you moves. Later, she says she was glad you stayed.', '“The noise,” she says, smiling a little. “She said a quiet café was a very sad thing.”'],
        gains: [{ bonds: 4 }, { culture: 4 }],
        note: 'A friendship can hold silence. Listening is not merely waiting for your turn to offer an answer.' },
      { title: 'The recipe', jp: 'また来てください。', en: 'Please come again.', at: 650,
        echo: { stage: 2, lines: ['The chair by the window has a cushion on it now.', 'The café is noisy tonight. Emi catches your eye and grins.'] },
        text: 'Emi gives you a handwritten recipe, complete with corrections and tea stains. “My mother’s,” she says. “You’ll get it wrong the first few times.” Her smile makes this sound like an invitation.',
        choices: ['Promise to bring your first attempt.', 'Suggest cooking it together.'],
        responses: ['“Even if it’s terrible,” she insists. Especially then, you suspect.', 'She finds another apron. The afternoon becomes a little less ordinary.'],
        gains: [{ bonds: 5 }, { culture: 5 }],
        note: 'Recipes, stories, and time can be gifts of trust. Receive them with attention.' }
    ],
    haru: [
      { title: 'A door in a book', jp: '本。', en: 'Book.', at: 60,
        text: 'Haru is arranging a shelf of fairy tales. You recognize a story about a wardrobe. He asks why you like impossible worlds. You tell him that sometimes they make ordinary things seem more real.',
        choices: ['Ask which story he would keep forever.', 'Tell him about a story that changed you.'],
        responses: ['He takes down a battered book. “This one makes me want to be kinder. That seems useful.”', 'He listens, then lends you something in return. Your Japanese is not ready for it yet. You keep it anyway.'],
        gains: [{ culture: 3 }, { jp: 3 }],
        note: 'Let curiosity run both ways. You have stories to share, and stories to receive.' },
      { title: 'Between the lines', jp: 'ゆっくりでいいですよ。', en: 'Take your time.', at: 650,
        echo: { stage: 0, lines: ['The battered book he would keep forever sits by the register, a bookmark halfway through.', 'The book he lent you is on your desk. You can read the first page now.'] },
        text: 'You try to read a page aloud. The same sentence defeats you three times. Haru doesn’t finish it for you. He points to a word you already know.',
        choices: ['Try again, a little more slowly.', 'Ask him to explain the picture first.'],
        responses: ['The sentence finally opens. It is about a fox, not a tax office. You both laugh.', 'The illustration gives you a foothold. Meaning arrives before every word does.'],
        gains: [{ jp: 4 }, { culture: 3 }],
        note: 'Learning can begin with context and pictures. Understanding is more than translating every word.' },
      { title: 'The question behind the question', jp: '希望。', en: 'Hope.', at: 240,
        text: '“You came here with a church,” Haru says. “What do you hope to do?” You look around the little shop. The grand answer you once rehearsed no longer fits as well as a small honest one.',
        choices: ['“Learn to love the people actually in front of me.”', '“Share the hope I have, and keep learning.”'],
        responses: ['He thinks about that. “That sounds harder than a plan.” You agree.', '“Then you’ll have to let us teach you something too.” You tell him you already have.'],
        gains: [{ bonds: 4 }, { culture: 4 }],
        note: 'Honest conversations about faith make room for questions and for another person’s freedom.' },
      { title: 'A shelf of windows', jp: '居場所。', en: 'A place to belong.', at: 400,
        echo: { stage: 2, lines: ['“Harder than a plan,” Haru says when he sees you, as if continuing a conversation. “How is it going?”', '“What have we taught you lately?” Haru asks. You tell him: the word for a book that makes you kinder.'] },
        text: 'Haru brings a box of books for the community room: poems, picture books, strange adventures. “Not everyone can travel,” he says. “But they ought to have windows.”',
        choices: ['Make a reading corner together.', 'Invite him to choose the first story.'],
        responses: ['You disagree about where the lamp goes. It feels wonderfully like being friends.', 'He chooses something funny. The children insist he read it twice.'],
        gains: [{ bonds: 5 }, { culture: 5 }],
        note: 'Shared interests can grow into shared work without turning the friendship into a project.' }
    ],
    sato: [
      { title: 'Too many cucumbers', jp: 'どうぞ。', en: 'Please, go ahead.', at: 60,
        text: 'Mrs. Sato appears with a bag of cucumbers and an air of mild accusation toward her garden. “It refuses to stop.” You came hoping to help people; your first task is to accept vegetables.',
        choices: ['Accept them warmly.', 'Ask how she likes to prepare them.'],
        responses: ['She seems relieved. The next morning, you leave a thank-you note with careful, uneven letters.', 'She explains with gestures, a sketch, and absolutely no measurements. This may be your most useful language lesson yet.'],
        gains: [{ bonds: 3 }, { culture: 3 }],
        note: 'Receiving help is part of belonging. Relationships are not a one-way movement of generosity.' },
      { title: 'The calendar on the wall', jp: 'すみません。', en: 'Excuse me / sorry.', at: 20,
        echo: { stage: 0, lines: ['Your uneven thank-you note is stuck to her refrigerator with a cucumber magnet.', 'You made her cucumber pickles. They were too salty. She ate three anyway.'] },
        text: 'You have put the recycling out on the wrong morning. Mrs. Sato points to a color-coded calendar. Your face feels hot. She brings a pen, not a lecture.',
        choices: ['Ask her to walk you through it.', 'Thank her and make a note.'],
        responses: ['She circles three dates. You circle them too. One small piece of life becomes less mysterious.', 'She adds a tiny drawing of a bottle. Some explanations need no translation.'],
        gains: [{ culture: 4 }, { jp: 3 }],
        note: 'Rubbish and recycling rules vary by municipality and building. In real life, check your local guide.' },
      { title: 'An ordinary homesickness', jp: '大丈夫。', en: 'Okay / all right.', at: 130,
        text: 'A familiar song from home catches you off guard. Mrs. Sato finds you quiet on the stairs. “Missing somewhere doesn’t mean you don’t like here,” she says.',
        choices: ['Tell her what you miss.', 'Ask whether she has ever felt far from home.'],
        responses: ['You talk about a kitchen, a voice, the smell of rain. She understands more than you expected.', 'She moved here as a young woman. The stairs become a bridge between two arrivals decades apart.'],
        gains: [{ bonds: 4 }, { culture: 4 }],
        note: 'Culture shock can come and go. Rest, familiar routines, and honest friendships can help you feel steadier.' },
      { title: 'A spare key', jp: 'お互い様。', en: 'We help each other.', at: 400,
        echo: { stage: 2, lines: ['“Does it still smell of rain where you come from?” she asks, handing you the key.', '“When I arrived,” she says, “someone did this for me. Now it is your turn to be trusted.”'] },
        text: 'Mrs. Sato asks you to water her plants while she visits her sister. She places a spare key in your hand. There is no ceremony, but you feel the weight of being trusted.',
        choices: ['Write down each plant’s needs.', 'Ask when she will be back for tea.'],
        responses: ['The smallest plant receives the longest explanation. You take your responsibility seriously.', '“Thursday,” she says. “And don’t bring cake. Actually, bring a small one.”'],
        gains: [{ culture: 5 }, { bonds: 5 }],
        note: 'Trust is often built through small, reliable acts that no one else sees.' }
    ],
    kenji: [
      { title: 'The stubborn soil', jp: 'こんにちは。', en: 'Hello.', at: 0,
        text: 'Kenji is kneeling by an empty garden bed. You ask what he is growing. “At the moment? Patience.” He hands you a pair of gloves.',
        choices: ['Ask where to begin.', 'Work quietly alongside him.'],
        responses: ['“With this one square.” The whole garden looks less impossible from the ground.', 'After a while, he shows you which roots to leave alone. Friendship takes a shape before it has many words.'],
        gains: [{ culture: 3 }, { bonds: 3 }],
        note: 'Working alongside someone can make conversation feel less pressured. Follow their lead.' },
      { title: 'Something you cannot hurry', jp: 'また明日。', en: 'See you tomorrow.', at: 240,
        echo: { stage: 0, lines: ['Your one square is still the neatest in the garden. Kenji pretends not to be proud of it.', 'Kenji hands you the gloves without a word. You both know where to start.'] },
        text: 'You check the seeds again. Nothing. Kenji points to the watering can. “Our part is this. The rest isn’t a button.”',
        choices: ['Water the bed and leave it alone.', 'Ask how he learned to wait.'],
        responses: ['There is relief in having a small, faithful part. You take the long way home.', '“Mostly by not waiting,” he admits. “I’ve killed quite a lot of tomatoes.”'],
        gains: [{ culture: 4 }, { bonds: 4 }],
        note: 'Steady care is different from control. That is true of gardens, and often of people.' },
      { title: 'Rain on everyone', jp: '水。', en: 'Water.', at: 20,
        text: 'Rain falls on the tidy beds and the weeds alike. Kenji asks why you are smiling. You say it reminds you of a story Jesus told about sunlight and rain, given generously.',
        choices: ['Share the thought, then ask what he sees.', 'Enjoy the rain together.'],
        responses: ['“I see less watering tomorrow,” he says. Then, after a pause, “And perhaps that too.”', 'You shelter beneath the shed roof. The garden does not require a conclusion.'],
        gains: [{ bonds: 4 }, { culture: 4 }],
        note: 'A shared moment can make space for faith without making agreement the price of friendship.' },
      { title: 'The first harvest', jp: 'おかげさまで。', en: 'Thanks to you / others.', at: 400,
        echo: { stage: 1, lines: ['“Not a button,” Kenji says, holding up the first tomato. You both laugh.', '“Only two tomatoes died this year,” Kenji announces. “A personal best.”'] },
        text: 'The first harvest is small enough to fit in a bowl. Kenji divides it anyway. You remember the empty soil. There are more people at the table now.',
        choices: ['Carry a share to Mrs. Sato.', 'Save some for the community supper.'],
        responses: ['She examines the vegetables with professional interest. “Not bad,” she says. High praise.', 'Kenji washes the bowl. Neither of you counts who did the most work.'],
        gains: [{ bonds: 5 }, { culture: 5 }],
        note: 'O-kage-sama-de acknowledges that things have gone well with the help of others.' }
    ],
    aiko: [
      { title: 'The kettle is already on', jp: 'お茶。', en: 'Tea.', at: 20,
        text: 'Aiko welcomes you to the little church’s community room. You explain that you have come as a missionary. “Then first,” she says, “you should learn where we keep the cups.” The room is full of unfinished, ordinary goodness.',
        choices: ['Ask how you can join the work already here.', 'Sit down and learn everyone’s names.'],
        responses: ['She shows you a list: mend a chair, visit a friend, buy milk. You begin to understand the scale of love.', 'The list is longer than you can remember. Aiko says there is no examination.'],
        gains: [{ culture: 3 }, { bonds: 3 }],
        note: 'You are joining a place where people already live, love, and serve. Begin as a guest and a learner.' },
      { title: 'A prayer with room in it', jp: '平和。', en: 'Peace.', at: 400,
        echo: { stage: 0, lines: ['The chair you mended no longer wobbles. Someone has sat in it every week since.', 'You remember most of the names now. Aiko still doesn’t examine you.'] },
        text: 'After the room grows quiet, Aiko lights a small candle. She asks if there is anyone you would like to remember in prayer. No one needs a polished speech.',
        choices: ['Pray for the neighbors you are coming to know.', 'Sit quietly and listen.'],
        responses: ['You use their names, not categories. The prayer feels smaller and more true.', 'The silence does not feel empty. Outside, someone laughs on the way home.'],
        gains: [{ bonds: 4 }, { culture: 4 }],
        note: 'This local community makes space for spoken prayer and quiet attention. Neither has to be a performance.' },
      { title: 'The open door', jp: '一緒に。', en: 'Together.', at: 130,
        text: 'Aiko suggests reading a parable at the next supper, if people would like to stay. “And if they don’t?” you ask. “Then we still wash their plates,” she says.',
        choices: ['Offer to help with the reading.', 'Offer to cook and stay for questions.'],
        responses: ['You choose the lost sheep. Aiko asks what the shepherd’s joy might sound like.', 'Someone asks a question you cannot answer. “I don’t know” turns out to be a good beginning.'],
        gains: [{ jp: 4 }, { bonds: 4 }],
        note: 'An invitation leaves people free to decline. Hospitality does not disappear when the answer is no.' },
      { title: 'The light in the window', jp: '居場所。', en: 'A place to belong.', at: 400,
        echo: { stage: 2, lines: ['Someone still talks about the shepherd’s joy. It has become a sort of joke, and a sort of prayer.', 'The person with the question you couldn’t answer comes every week now. They have more questions.'] },
        text: 'One evening you come back late and find a lamp left on. Aiko is stacking chairs. “I thought you might want somewhere to sit.” You have been trying to make a home for others, and discover you have been given one.',
        choices: ['Stay and share what this place has meant.', 'Help with the chairs, then make tea.'],
        responses: ['The words come imperfectly, in two languages. They are understood.', 'You know where the cups are now. Some arrivals take a long time.'],
        gains: [{ bonds: 5 }, { culture: 5 }],
        note: 'A life of service also needs a place to receive care. Belonging is something shared.' }
    ]
  };

  // Ordinary visits: no milestone, just life. Shown in rotation.
  const moments = {
    sato: [
      'Mrs. Sato is sweeping the stairs. She hands you the dustpan without comment. You are, apparently, part of the system now.',
      'She asks whether you are eating properly. You say yes. She gives you rice balls anyway.',
      'Mrs. Sato teaches you the word for the little sparrows on the wire: 雀, suzume. She says they are noisy neighbors too.',
      'You find her squinting at a letter from the city office. You can read three words of it. Together, that is enough.',
      'She is watching the cherry tree from her window. “Every year I think it won’t,” she says. “Every year it does.”'
    ],
    emi: [
      'Emi is trying a new cake. She makes you taste it and watches your face very seriously. It is good. She does not believe you.',
      'The café is quiet. Emi is doing accounts and sighing. You wipe the tables. She doesn’t stop you.',
      'Emi teaches you how to order like a regular: “いつもの” — the usual. You don’t have a usual yet. She decides you do.',
      'A student is studying at the corner table. Emi refills his tea without charging. “Exams,” she whispers.',
      'Emi asks how your week was and actually waits for the answer.'
    ],
    haru: [
      'Haru is repairing a book spine with rice glue and great tenderness.',
      'He recommends a picture book “for your Japanese level.” It is for five-year-olds. It is also very good.',
      'Haru is reading poetry behind the counter. He reads you one line and won’t translate it. “Some things should be a little out of reach,” he says.',
      'A child is sitting on the bookshop floor, lost in a book about dinosaurs. Haru puts a cushion under her without her noticing.',
      'He asks what you are reading. You tell him. He nods slowly, which means he has opinions.'
    ],
    kenji: [
      'Kenji is talking to the tomatoes. When he sees you he pretends he was clearing his throat.',
      'You pull weeds together in companionable silence. A crow supervises.',
      'Kenji shows you how to tie a vine to a bamboo stake. Your knot is wrong. He leaves it. “It’ll hold,” he says.',
      'He gives you a cucumber “for Mrs. Sato.” You suspect a long-running vegetable rivalry.',
      'Kenji is sitting on an upturned bucket watching the evening come. He moves over so there is room for two.'
    ],
    aiko: [
      'Aiko is mending a tablecloth. She asks you to thread the needle because her eyes are tired.',
      'The community room smells of barley tea and floor wax. Aiko is writing birthday cards to people who never come on Sundays.',
      'She asks how you are — really. You tell her. She doesn’t fix anything. It helps.',
      'Aiko is practicing a hymn on the old piano. One key sticks. She plays around it.',
      'She shows you a photo of the room forty years ago: the same chairs, different faces, the same kettle.'
    ]
  };

  const api = { WORDS, LESSONS, HIRAGANA, KATAKANA, KANJI, PEOPLE, STORY_AT, stories, moments };
  if (typeof module !== 'undefined') module.exports = api;
  else root.Content = api;
})(typeof window !== 'undefined' ? window : globalThis);
