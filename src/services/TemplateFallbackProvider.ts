/**
 * Template Fallback Provider - Provides template-based poetry when AI services are unavailable
 * Organizes poetry templates by mood and selects appropriate templates based on audio features
 */

import type { AudioFeatures } from '../types/audio';
import type { PoetryStyle } from '../types/poetry';

/**
 * Poetry template organized by mood category
 */
interface PoetryTemplate {
  mood: string;
  templates: string[];
}

/**
 * Template Fallback Provider class
 * Provides pre-written poetry templates as fallback when AI generation fails
 */
export class TemplateFallbackProvider {
  private templates: PoetryTemplate[];

  constructor() {
    this.templates = this.initializeTemplates();
  }

  /**
   * Generate poetry from audio features using templates
   */
  generateFromAudioFeatures(features: AudioFeatures, style?: PoetryStyle): string {
    const mood = this.inferMood(features);
    return this.selectTemplate(mood, style);
  }

  /**
   * Generate poetry from mood descriptor using templates
   */
  generateFromMood(mood: string, style?: PoetryStyle): string {
    return this.selectTemplate(mood, style);
  }

  /**
   * Get all available mood categories
   */
  getAvailableMoods(): string[] {
    return this.templates.map(t => t.mood);
  }

  /**
   * Get templates for a specific mood
   */
  getTemplatesForMood(mood: string): string[] {
    const template = this.templates.find(t => t.mood === mood);
    return template ? [...template.templates] : [];
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Initialize the poetry template library
   * Korean templates for ~500 characters
   */
  private initializeTemplates(): PoetryTemplate[] {
    return [
      {
        mood: 'joyful',
        templates: [
          '밤하늘에 별빛이 춤추고\n리듬은 영혼을 깨운다\n모든 혈관을 타고 흐르는 에너지\n기쁨과 음악, 하나의 노래가 되어\n\n빛나는 순간들이 모여\n행복의 선율을 만들어낸다\n모든 음표가 환희의 폭발\n음악이 이 순간을 선명하게 한다\n\n웃음소리가 공기를 채우고\n비할 데 없는 멜로디가 울려퍼진다\n완벽한 시간 속 기쁜 마음들\n삶과 음악, 둘 다 숭고하게',
          '춤추는 빛과 치솟는 소리\n행복과 리듬이 만나는 곳\n모든 음표가 환희를 터뜨리고\n음악이 순간을 밝게 비춘다\n\n밝고 대담하게 음악이 흐르고\n햇살이 우리의 춤추는 날들을 채운다\n모든 박자가 축제가 되어\n순수하고 완벽한 환희로 가득하다',
        ],
      },
      {
        mood: 'energetic',
        templates: [
          '천둥이 전기 같은 혈관을 타고 흐르고\n힘이 솟구치며 아무것도 막을 수 없다\n극적인 파도가 부딪치고 충돌하며\n이 폭풍 속에서 우리는 숨을 수 없다\n\n맹렬하고 대담하게 음악이 울부짖고\n벽을 흔들며 문을 열어젖힌다\n모든 박자에 강렬함이 담겨\n열정과 힘이 만나는 곳\n\n번개가 모든 음표와 함께 내리치고\n에너지의 파도 위를 우리는 떠다닌다\n멈출 수 없고 거칠며 자유로운\n이곳이 우리가 있어야 할 곳',
          '앞으로 질주하며 결코 느려지지 않고\n빠른 리듬이 밀려왔다 물러간다\n흥분이 모든 박자와 함께 쌓여가며\n속도와 멜로디가 만나는 곳\n\n강렬한 에너지가 온몸을 휘감고\n멈출 수 없는 힘이 우리를 이끈다\n음악의 파도가 높이 솟구치며\n새로운 세계로 우리를 데려간다',
        ],
      },
      {
        mood: 'melancholic',
        templates: [
          '희미해지는 빛 속 부드러운 속삭임\n기억들이 끝없는 밤을 떠돈다\n부드러운 슬픔, 달콤하면서도 쓰라린\n침묵과 소리가 만나는 곳\n\n그림자가 시간의 벽 위에서 춤추고\n먼 종소리의 메아리가 들린다\n단조의 조용한 생각들\n예전의 모습을 비추는 반영\n\n눈물이 가을비처럼 떨어지고\n음악이 아픈 고통을 달래준다\n슬픔 속에서 아름다움이 자라나며\n가장 깊은 감정이 흐르는 곳',
          '외로운 음표들이 공기를 떠돌며\n부드러운 보살핌의 무게를 싣고 간다\n우울함의 부드러운 포옹이\n이 조용한 공간에서 집을 찾는다\n\n시간은 천천히 흐르고\n기억은 희미해져 가지만\n음악 속에서 우리는 다시 만나\n잃어버린 순간들을 되찾는다',
        ],
      },
      {
        mood: 'calm',
        templates: [
          '해변에 부드러운 파도가 밀려오고\n평화로운 순간들, 그 이상은 없다\n산들바람 속 부드러운 속삭임\n우리에게 평안을 가져다주는 조용한 생각들\n\n고요함이 이슬처럼 내려앉고\n잔잔한 수평선, 푸른 하늘\n모든 음표에 평온함이 담겨\n고요한 바다 위를 우리는 부드럽게 떠다닌다\n\n평화로운 리듬, 부드럽고 느리게\n잔잔한 물이 흐르는 곳\n고요함 속에서 우리는 쉼을 찾고\n음악의 평온함, 부드러운 손님',
          '침묵이 미묘한 방식으로 말하고\n음악의 부드러운 안개를 통해\n평온하고 중심을 잡은 채, 여기 머물며\n이 평화롭고 완벽한 날 속에서\n\n시간은 천천히 흐르고\n마음은 고요해진다\n음악이 우리를 감싸며\n평화의 품 안으로 이끈다',
        ],
      },
      {
        mood: 'dramatic',
        templates: [
          '소리 속에서 서사시가 펼쳐지고\n용감한 이야기와 대담한 전설들\n오르락내리락하는 극적인 물결\n음악의 힘이 모든 것을 정복한다\n\n긴장이 모든 구절과 함께 쌓이고\n음악의 복잡한 미로를 통과하며\n극적인 높이와 깊은 심연\n이 음표들 속에서 우리는 자유로워진다\n\n크레센도가 대지를 흔들고\n극적인 힘이 발견되는 곳\n모든 음표가 선언이 되어\n음악의 웅장한 서사를 펼친다',
          '대담하고 맹렬하게 음악이 외치며\n끝없는 하늘을 향해 뻗어간다\n극적인 열정, 억제되지 않고\n모든 음표에 감정이 사슬처럼 엮여\n\n폭풍이 몰아치고 천둥이 울리며\n음악은 우리를 새로운 세계로 이끈다\n극적인 순간들이 쌓여가며\n영원히 기억될 이야기를 만든다',
        ],
      },
      {
        mood: 'contemplative',
        templates: [
          '시간은 천천히 흐르고, 음표 하나하나\n명상 위를 우리는 떠다닌다\n깊고 진실한 성찰의 순간들\n음악 속에서 우리는 새로워진다\n\n조용한 공간을 통과하는 신중한 발걸음\n사려 깊은 리듬, 부드러운 속도\n느림 속에서 지혜가 자라나고\n가장 깊은 감정이 흐르는 곳\n\n질문들이 공기 중에 머물고\n음악의 보살핌 속에서 답을 찾는다\n명상적이고 고요하게\n들리는 것과 보이는 것 사이에서',
          '신비를 숙고하며\n이 부드러운 멜로디를 통해\n사려 깊은 음악, 부드럽고 현명하게\n진실이 우리 눈에 비친다\n\n깊은 생각에 잠기며\n음악은 우리를 인도한다\n내면의 목소리에 귀 기울이며\n진정한 자아를 발견한다',
        ],
      },
      {
        mood: 'mysterious',
        templates: [
          '그림자가 오래된 비밀을 속삭이고\n음표 속에서 신비가 펼쳐진다\n숨겨진 의미들, 베일에 싸이고 깊은\n음악의 신비로운 보관소 안에\n\n수수께끼 같은 멜로디들이\n신비를 통과하며 춤춘다\n무엇이 숨겨지고 무엇이 드러나는지\n이 소리들 속에서, 미지의 것\n\n암호 같은 리듬, 낯설고 새로운\n모든 색조에 신비가 담겨\n음악이 여기서 수수께끼로 말하며\n경이로움을 점점 더 가까이 끌어당긴다',
          '고대의 메아리, 현대의 소리\n신비로운 것이 발견되는 곳\n음악의 비밀스러운 심장 속에서\n신비와 음악, 결코 떨어지지 않는다\n\n어둠 속에서 빛이 깜박이고\n알 수 없는 것들이 우리를 부른다\n음악은 비밀의 언어로 말하며\n새로운 세계로의 문을 연다',
        ],
      },
      {
        mood: 'uplifting',
        templates: [
          '소리의 날개를 타고 올라가며\n희망과 음악이 발견되는 곳\n영혼을 고양시키고, 마음이 날아오르며\n음악의 빛에 이끌려간다\n\n모든 음표가 우리를 더 높이 들어올리고\n희망의 영원한 불꽃에 연료를 공급한다\n위로, 앞으로, 태양을 향해\n음악과 영혼이 하나가 된다\n\n치솟는 멜로디가 영감을 주고\n세속의 진흙탕에서 마음을 들어올린다\n음악 속에서 우리는 상승하며\n끝없는 지평선을 향해 나아간다',
          '희망이 모든 화음 속에서 울려퍼지고\n신성한 말씀처럼 고양시킨다\n음악이 들어올리고, 음악이 치유하며\n영혼이 느끼는 것을 우리에게 보여준다\n\n새로운 날이 밝아오고\n음악은 우리를 이끌어간다\n희망의 노래가 울려퍼지며\n더 나은 내일을 약속한다',
        ],
      },
      {
        mood: 'upbeat',
        templates: [
          '경쾌한 리듬이 발걸음을 재촉하고\n밝은 멜로디가 마음을 들뜨게 한다\n활기찬 에너지가 온몸을 감싸며\n긍정의 물결이 우리를 휩싼다\n\n박자에 맞춰 몸이 움직이고\n즐거운 선율이 귓가를 맴돈다\n경쾌함 속에서 우리는 자유로워지며\n음악이 주는 기쁨에 흠뻑 빠진다\n\n밝고 경쾌한 음악의 흐름 속에서\n우리는 새로운 활력을 얻는다\n긍정적인 에너지가 넘쳐나며\n삶의 즐거움을 만끽한다',
          '신나는 비트가 공간을 채우고\n경쾌한 화음이 분위기를 띄운다\n활기찬 리듬에 몸을 맡기며\n우리는 순간의 즐거움을 느낀다\n\n밝은 에너지가 사방으로 퍼지고\n긍정의 파동이 마음을 적신다\n경쾌한 음악이 우리를 이끌며\n행복한 순간들을 만들어간다',
        ],
      },
    ];
  }

  /**
   * Select an appropriate template based on mood and style
   */
  private selectTemplate(mood: string, style?: PoetryStyle): string {
    // Find exact mood match
    let template = this.templates.find(t => t.mood === mood);

    // If no exact match, try to find a close match
    if (!template) {
      template = this.findClosestMood(mood);
    }

    // Fallback to calm if nothing matches
    if (!template) {
      template = this.templates.find(t => t.mood === 'calm');
    }

    // This should never happen, but just in case
    if (!template || template.templates.length === 0) {
      return 'Music flows through time and space,\nFinding beauty, finding grace.';
    }

    // Select a random template from the mood category
    const randomIndex = Math.floor(Math.random() * template.templates.length);
    let selectedTemplate = template.templates[randomIndex];

    // Adjust template based on style if provided
    if (style) {
      selectedTemplate = this.adjustTemplateForStyle(selectedTemplate, style);
    }

    return selectedTemplate;
  }

  /**
   * Find the closest matching mood from available templates
   */
  private findClosestMood(targetMood: string): PoetryTemplate | undefined {
    const moodLower = targetMood.toLowerCase();

    // Check for partial matches
    for (const template of this.templates) {
      if (moodLower.includes(template.mood) || template.mood.includes(moodLower)) {
        return template;
      }
    }

    // Check for keyword matches
    const moodKeywords: Record<string, string[]> = {
      joyful: ['happy', 'joy', 'cheerful', 'bright', 'positive'],
      energetic: ['intense', 'powerful', 'strong', 'fast', 'exciting'],
      melancholic: ['sad', 'sorrow', 'blue', 'lonely', 'wistful'],
      calm: ['peaceful', 'tranquil', 'serene', 'gentle', 'quiet'],
      dramatic: ['epic', 'grand', 'bold', 'theatrical'],
      contemplative: ['thoughtful', 'reflective', 'meditative', 'pensive'],
      mysterious: ['enigmatic', 'cryptic', 'hidden', 'secret'],
      uplifting: ['inspiring', 'hopeful', 'encouraging'],
      upbeat: ['lively', 'bouncy', 'peppy', 'spirited', 'animated', 'buoyant'],
    };

    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      if (keywords.some(keyword => moodLower.includes(keyword))) {
        return this.templates.find(t => t.mood === mood);
      }
    }

    return undefined;
  }

  /**
   * Adjust template based on poetry style preferences
   */
  private adjustTemplateForStyle(template: string, style: PoetryStyle): string {
    let adjusted = template;

    // Adjust length
    const lines = template.split('\n');
    if (style.length === 'short' && lines.length > 4) {
      // Take first 2-3 lines for short
      adjusted = lines.slice(0, Math.min(3, lines.length)).join('\n');
    } else if (style.length === 'long' && lines.length < 6) {
      // For long, we can't really extend templates, so just return as is
      // In a real implementation, we might combine multiple templates
      adjusted = template;
    }

    // Note: Structure adjustments (haiku, sonnet) would require more complex
    // template transformations or separate template sets, which is beyond
    // the scope of this fallback system. The templates are designed as
    // free-verse which works for most cases.

    return adjusted;
  }

  /**
   * Infer mood from audio features
   * Considers intensity, energy, valence, and tempo
   */
  private inferMood(features: AudioFeatures): string {
    const { energy, valence, tempo, intensity } = features;
    
    // Use intensity if available, otherwise fall back to energy
    const powerLevel = intensity !== undefined ? intensity : energy;

    // High intensity/power with positive valence = upbeat
    if (powerLevel > 0.7 && valence > 0.5 && tempo > 100) {
      return 'upbeat';
    }

    // High energy, high valence = joyful
    if (energy > 0.7 && valence > 0.6) {
      return 'joyful';
    }

    // High intensity/power, low valence = dramatic
    if (powerLevel > 0.7 && valence < 0.4) {
      return 'dramatic';
    }

    // High energy, low valence = energetic
    if (energy > 0.7 && valence < 0.4) {
      return 'energetic';
    }

    // Low energy, low valence = melancholic
    if (energy < 0.3 && valence < 0.4) {
      return 'melancholic';
    }

    // Low energy, high valence = calm
    if (energy < 0.3 && valence > 0.6) {
      return 'calm';
    }

    // Medium energy, medium valence = contemplative
    if (energy > 0.3 && energy < 0.7 && valence > 0.4 && valence < 0.6) {
      return 'contemplative';
    }

    // Very fast tempo = energetic
    if (tempo > 140) {
      return 'energetic';
    }

    // Very slow tempo = contemplative
    if (tempo < 80) {
      return 'contemplative';
    }

    // Medium characteristics with slight mystery
    if (energy > 0.4 && energy < 0.6 && valence < 0.5) {
      return 'mysterious';
    }

    // Positive but not too energetic = uplifting
    if (valence > 0.6 && energy > 0.4 && energy < 0.7) {
      return 'uplifting';
    }

    // Default to calm
    return 'calm';
  }
}
