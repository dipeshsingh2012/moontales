import { IAIService } from './AIService.interface';
import { Story, StoryGenerationOptions } from '../../types';

// Story templates keyed by theme
const STORY_TEMPLATES: Record<string, { title: string; pages: string[] }[]> = {
  fantasy: [
    {
      title: 'The Wizard\'s Lost Spell',
      pages: [
        'In the kingdom of Luminos, where stars fell like snowflakes every night, lived a young wizard named Pip who had just lost his most important spell.',
        'Pip searched his tower top to bottom, tipping over cauldrons and unfurling ancient scrolls, but the spell was nowhere to be found.',
        'A tiny talking fox appeared on his windowsill. "I saw a moonbird carry something sparkling into the Whispering Woods," she said.',
        'Together they journeyed through trees that hummed lullabies and rivers that glowed like liquid moonlight.',
        'Deep in the woods, the moonbird had woven the spell into its nest to warm its eggs. Pip smiled — he had found something better than a spell. He\'d found a friend.',
      ],
    },
    {
      title: 'The Dragon Who Was Afraid of Fire',
      pages: [
        'High in the Ember Mountains lived Cinder, a dragon who was afraid of one thing — fire. Every time she sneezed, she covered her mouth and hoped for the best.',
        'The other dragons laughed, but Cinder didn\'t mind. She spent her days painting ice sculptures and growing frost-flowers in the cool mountain caves.',
        'One winter, a blizzard trapped the whole village below. The dragons tried to help but their fire melted too fast.',
        'Cinder thought hard. She carefully breathed the smallest, gentlest flame she\'d ever made — just enough to warm a circle for the villagers to shelter in through the night.',
        'By morning the blizzard had passed. The villagers cheered, and Cinder finally understood: her fire was never too small — it was perfectly sized for kindness.',
      ],
    },
  ],
  adventure: [
    {
      title: 'The Map Under the Floorboard',
      pages: [
        'On a rainy afternoon, while the thunder grumbled outside, young Milo discovered a rolled-up map hidden under a loose floorboard in the attic.',
        'The map showed their very own town — but with secret paths, underground rivers, and a big red X marked in the old clocktower.',
        'Milo grabbed a torch, a biscuit for courage, and set off into the drizzle, following the dotted path on the map.',
        'Inside the clocktower\'s dusty basement, behind a wall of gears, was a small wooden box filled with old photographs and a letter that said: "For the next brave explorer who finds this — the real treasure is the journey."',
        'Milo smiled, tucked the letter safely away, and added their own photograph to the box for the next explorer to find someday.',
      ],
    },
  ],
  space: [
    {
      title: 'The Star That Fell Into the Garden',
      pages: [
        'One night, Zara watched through her telescope as a tiny star wobbled, blinked twice, and tumbled out of the sky straight into her vegetable garden.',
        'She ran outside in her pyjamas to find a small, warm, glowing creature sitting in the carrot patch, looking very confused.',
        '"I took a wrong turn at the Milky Way," it said, in a voice like wind chimes. "I need to get back before morning or my constellation will have a gap."',
        'Zara had an idea. She set up her telescope, pointed it at the brightest part of the sky, and together they mapped a route home using the patterns of stars.',
        'The little star rose slowly back into the night sky, and as it found its place, it winked — and Zara noticed her own name spelled out in the stars above her garden.',
      ],
    },
  ],
  animals: [
    {
      title: 'The Kindest Hedgehog in the Meadow',
      pages: [
        'Hazel the hedgehog was the smallest creature in Buttercup Meadow, but she had the biggest collection of lost things — buttons, acorns, a red ribbon, and one small key.',
        'Every morning she would hold up each item and wait, in case someone came looking. Most days no one did, but Hazel didn\'t mind. She was very patient.',
        'One afternoon, a sobbing rabbit named Clover hopped past. She had lost the key to her burrow and couldn\'t get home.',
        'Hazel held up her little key. "Is this yours?" Clover gasped and hugged her so hard all Hazel\'s spines stood on end.',
        'Clover invited Hazel to live in the burrow as her neighbour. Hazel brought her whole collection — and they spent many happy evenings returning lost things to the meadow creatures together.',
      ],
    },
  ],
  ocean: [
    {
      title: 'The Lighthouse Keeper\'s Daughter',
      pages: [
        'Marina lived with her mother in a tall striped lighthouse at the edge of the world, where the sea was so blue it looked like a piece of fallen sky.',
        'Every night she helped polish the great light so ships could find their way safely. But one stormy evening, the light went out.',
        'Marina climbed to the very top with nothing but a lantern and a determination like an anchor. The wind howled and the waves crashed far below.',
        'She held her lantern high and waited. The ships saw her small flickering light and steered safely past the rocks, one by one.',
        'By morning the storm had calmed. The ships\' crews waved from the harbour. Marina\'s lantern had burned through the night, and so had her bravery.',
      ],
    },
  ],
  dinosaurs: [
    {
      title: 'The Dinosaur Who Loved Flowers',
      pages: [
        'Bumble was a triceratops, and while the other dinosaurs stomped and roared, Bumble spent every day carefully collecting the most beautiful flowers in the valley.',
        'The long-necked brachiosauruses thought it was very strange. "Flowers are for eating!" they said. But Bumble just smiled and tucked a daisy behind one horn.',
        'Then the dry season came, and the valley\'s flowers began to disappear. All the dinosaurs felt sad, though none of them had ever said they liked flowers before.',
        'Bumble had saved the seeds of every flower she\'d ever collected, kept safe in a cool hollow log. She planted them all along the river bank.',
        'When the rains returned, the valley bloomed more beautifully than ever. Even the brachiosauruses stopped to look — and forgot to eat — for a full five minutes.',
      ],
    },
  ],
  superheroes: [
    {
      title: 'The Girl Who Could Hear Quiet Things',
      pages: [
        'Penny had a superpower that no one could see. She could hear things that were too quiet for anyone else — a snail thinking, a flower opening, a friend trying not to cry.',
        'At school, while the noisy superheroes showed off their flying and their lightning bolts, Penny sat quietly and listened.',
        'One day she heard something very faint — her best friend Sam, on the other side of the playground, trying very hard to seem fine but feeling very, very sad.',
        'Penny walked over and sat beside Sam without saying a word. After a moment, Sam whispered, "How did you know?" Penny just smiled.',
        '"The best superpower," her grandmother always said, "is knowing when someone needs you." And Penny had it in the most perfect measure.',
      ],
    },
  ],
  'fairy tales': [
    {
      title: 'The Princess Who Fixed Things',
      pages: [
        'In a kingdom where everything was slightly broken, from the creaky drawbridge to the king\'s wobbly crown, there lived a princess named Wren who always carried a toolkit.',
        'While other princesses learned to dance at balls, Wren learned to fix bellows, rehinge doors, and patch the royal telescope so it could see the moons of distant planets.',
        'When a great storm broke the mill that ground flour for the whole kingdom, everyone wrung their hands. Except Wren.',
        'She worked for three days and two nights, up to her elbows in cogs and waterwheel spokes, until the mill turned again and the smell of fresh bread filled the village.',
        'The king offered her any reward. "A better workshop," said Wren. "And maybe someone to bring me biscuits while I work." Both were granted immediately.',
      ],
    },
  ],
};

const DEFAULT_STORIES = STORY_TEMPLATES['fantasy'];

function pickStory(theme: string, prompt: string) {
  const key = Object.keys(STORY_TEMPLATES).find((k) =>
    theme.toLowerCase().includes(k)
  );
  const pool = key ? STORY_TEMPLATES[key] : DEFAULT_STORIES;
  return pool[Math.floor(Math.random() * pool.length)];
}

function injectCharacters(text: string, characters: string[]): string {
  if (!characters.length) return text;
  // Replace the first occurrence of generic names with the provided characters
  const generics = ['Pip', 'Milo', 'Zara', 'Hazel', 'Marina', 'Bumble', 'Penny', 'Wren', 'Cinder'];
  let result = text;
  characters.forEach((char, i) => {
    if (generics[i]) {
      result = result.split(generics[i]).join(char);
    }
  });
  return result;
}

export class MockAIService implements IAIService {
  async generateStory(options: StoryGenerationOptions): Promise<Story> {
    // Small artificial delay so it feels like something is happening
    await new Promise((r) => setTimeout(r, 1200));

    const theme = options.theme || 'fantasy';
    const characters = options.characters || [];
    const template = pickStory(theme, options.prompt);

    const pages = template.pages.map((text, idx) => ({
      page_number: idx + 1,
      text: injectCharacters(text, characters),
      audio_text: injectCharacters(text, characters),
      image_prompt: `${theme} children's book illustration: ${text.slice(0, 60)}`,
      image_url: '',
      audio_url: '',
      alignment: { characters: [], character_start_times_ms: [], character_end_times_ms: [] },
      illustrationPrompt: `${theme} children's book illustration: ${text.slice(0, 60)}`,
    }));

    return {
      id: Date.now().toString(),
      status: 'completed' as const,
      title: injectCharacters(template.title, characters),
      page_count: pages.length,
      pages,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      error_message: null,
      isFavorite: false,
      // Legacy
      content: pages.map((p) => p.text).join('\n\n'),
      metadata: {
        createdAt: new Date(),
        theme,
        characters,
        length: options.length || 'medium',
        aiProvider: 'demo',
      },
    };
  }

  async generateIllustration(_prompt: string): Promise<string> {
    return '';
  }

  getProviderName(): string {
    return 'Demo';
  }
}
