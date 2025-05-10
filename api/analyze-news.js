const { Configuration, OpenAIApi } = require("openai");

exports.handler = async function(event, context) {
  try {
    const { title, content } = JSON.parse(event.body);

    // OpenAI APIなどで判定（例）
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const prompt = `次のニュースがフェイクニュースかどうか判定してください。\nタイトル: ${title}\n本文: ${content}\n判定と理由を日本語で簡潔に答えてください。`;

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
    });

    const result = completion.data.choices[0].message.content;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ result }),
    };
  } catch (error) {
    console.error("ニュース分析エラー:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "ニュース分析に失敗しました" }),
    };
  }
};