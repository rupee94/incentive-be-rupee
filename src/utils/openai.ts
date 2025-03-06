import { OPENAI_API_KEY } from '../config/environments';
import { generateObject, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import prompts from '../prompts';
import { OpenAI } from 'openai';
import fs from 'fs';
import similarity from 'cosine-similarity';
import { mediumArticles } from '../article/medium';
import { tweetArticles } from '../article/tweets';

// OpenAI 설정 For TEST
const _openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function IntentDetect(text: string, intent: string[]) {
  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    temperature: 0,
    system: prompts.IntentDetect,
    schema: z.object({
      intent: z.enum(intent as [string, ...string[]]),
    }),
    prompt: text,
  });

  return object.intent;
}

export async function IntentDetectWithConfidence(
  text: string,
  intent: string[],
) {
  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    temperature: 0,
    system: prompts.IntentDetectWithConfidence,
    schema: z.object({
      intents: z.object(
        intent.reduce(
          (acc, currIntent) => {
            acc[currIntent] = z.number().min(0).max(1);
            return acc;
          },
          {} as Record<string, any>,
        ),
      ),
    }),
    prompt: text,
  });

  return object.intents;
}

export async function RetweetText(targetTweet: string) {
  const result = await generateText({
    model: openai('gpt-4o-mini'),
    temperature: 0,
    system: prompts.RetweetText(targetTweet),
    prompt: targetTweet,
  });

  return result.text;
}

export async function Tone1Fitting(text: string) {
  const result = await generateText({
    model: openai('gpt-4o-mini'),
    temperature: 0,
    system: prompts.Tone1,
    prompt: text,
  });

  return result.text;
}

export async function Tone2Fitting(text: string) {
  const result = await generateText({
    model: openai('gpt-4o-mini'),
    temperature: 0,
    system: prompts.Tone2,
    prompt: text,
  });
  return result.text;
}

// 텍스트 임베딩 생성
export async function getEmbedding(text: string) {
  try {
    const response = await _openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', text);
  }
}

export async function saveMediumArticlesToFile() {
  const articles = tweetArticles;
  const embeddings = [];

  for (const article of articles) {
    const embedding = await getEmbedding(article); // OpenAI로 벡터화
    embeddings.push({
      text: article,
      embedding: embedding,
    });
  }

  // 미디엄 글 벡터들을 JSON 파일로 저장
  fs.writeFileSync(
    'tweet_articles_embeddings.json',
    JSON.stringify(embeddings, null, 2),
  );
  console.log('Medium articles vectors saved!');
}

export async function findRelatedMediumArticles(tweet: string, url?: string) {
  const tweetEmbedding = await getEmbedding(tweet); // 트윗을 벡터화

  // 미디엄 글 벡터 불러오기
  const mediumArticles = JSON.parse(
    fs.readFileSync('medium_articles_embeddings.json', 'utf8'),
  );
  const tweetArticles = JSON.parse(
    fs.readFileSync('tweet_articles_embeddings.json', 'utf8'),
  );

  // 가장 유사한 글 찾기
  let maxSimilarity = 0;
  let relatedArticle = null;

  const allArticles = [...mediumArticles, ...tweetArticles]; // 두 배열을 합침

  for (const article of allArticles) {
    const cos_similarity = similarity(tweetEmbedding, article.embedding); // 코사인 유사도 계산

    if (cos_similarity > maxSimilarity) {
      maxSimilarity = cos_similarity;
      relatedArticle = article;
    }
  }

  let result = relatedArticle;
  // if (maxSimilarity > 0.38) {
  //   result = relatedArticle;
  // }

  console.log('maxSimilarity', maxSimilarity, url);
  return result;
}
