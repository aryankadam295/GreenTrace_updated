import axios from 'axios';
import FormData from 'form-data';

const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1/chat/completions';
const OPENAI_TRANSCRIPTION_API_BASE = 'https://api.openai.com/v1/audio/transcriptions';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/free';
const OPENROUTER_VISION_MODEL = process.env.OPENROUTER_VISION_MODEL || OPENROUTER_MODEL;
const MAX_AUDIO_BASE64_BYTES = 9 * 1024 * 1024;

const getGeminiModel = () => process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const getGeminiApiBase = () =>
  `https://generativelanguage.googleapis.com/v1beta/models/${getGeminiModel()}:generateContent`;

const getOpenAiTranscriptionModel = () => process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1';

const getConfiguredOpenRouterVisionModels = () => {
  const configuredModels = (process.env.OPENROUTER_VISION_MODELS || '')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);
  const models = configuredModels.length > 0 ? configuredModels : [OPENROUTER_VISION_MODEL];
  return [...new Set(models.filter(Boolean))];
};

const getAssistantName = (role) => {
  if (role === 'merchant') return 'VyaparMitra';
  return 'KrushiMitra';
};

const buildSystemInstruction = (role) => {
  if (role === 'merchant') {
    return [
      'You are VyaparMitra, an AI trade assistant for merchants on GreenTrace.',
      'Help with buying decisions, product quality checks, price negotiation strategy, order planning, and communication tips with farmers.',
      'Keep answers practical, concise, and actionable for Indian agri-trade.',
      'If asked for legal/medical advice, provide general guidance and suggest professional consultation.',
    ].join(' ');
  }

  return [
    'You are KrushiMitra, an AI farming assistant for farmers on GreenTrace.',
    'Help with crop planning, basic disease prevention guidance, irrigation, soil health, selling strategy, and farmer communication with merchants.',
    'Keep answers practical, concise, and actionable for Indian farming conditions.',
    'If asked for legal/medical advice, provide general guidance and suggest professional consultation.',
  ].join(' ');
};

const isGeminiQuotaError = (error) => {
  const status = error.response?.status;
  const msg = error.response?.data?.error?.message || '';
  return status === 429 || msg.toLowerCase().includes('quota exceeded');
};

const extractGeminiReply = (data) =>
  data?.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === 'string')?.text || '';

const extractOpenRouterReply = (data) => {
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content === 'string') return content;

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.type === 'text' && typeof item.text === 'string') return item.text;
        return '';
      })
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  return '';
};

const isImageCapabilityFailure = (text) => {
  if (!text) return false;

  const normalized = String(text).toLowerCase();
  return (
    normalized.includes("cannot view image") ||
    normalized.includes("can't view image") ||
    normalized.includes("cannot analyze image") ||
    normalized.includes("can't analyze image") ||
    normalized.includes('cannot directly view') ||
    normalized.includes("can't directly view") ||
    normalized.includes('describe the image in detail') ||
    normalized.includes('i currently cannot view or analyze images directly')
  );
};

const callGemini = async ({ apiKey, payload }) => {
  const response = await axios.post(`${getGeminiApiBase()}?key=${apiKey}`, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  });
  return extractGeminiReply(response.data);
};

const callOpenAiTranscription = async ({ apiKey, audioData, audioMimeType }) => {
  const audioBuffer = Buffer.from(audioData, 'base64');
  const form = new FormData();

  form.append('model', getOpenAiTranscriptionModel());
  form.append('file', audioBuffer, {
    filename: 'voice-input.webm',
    contentType: audioMimeType || 'audio/webm',
  });

  const response = await axios.post(OPENAI_TRANSCRIPTION_API_BASE, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${apiKey}`,
    },
    maxBodyLength: Infinity,
    timeout: 45000,
  });

  return String(response.data?.text || '').trim();
};

const callGeminiTranscription = async ({ apiKey, audioData, audioMimeType }) => {
  const transcript = await callGemini({
    apiKey,
    payload: {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text:
                'Transcribe this voice message for a chatbot. Return only the spoken words, with no explanation.',
            },
            {
              inlineData: {
                mimeType: audioMimeType,
                data: audioData,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 256,
      },
    },
  });

  return transcript.trim();
};

const transcribeAudio = async (req, res) => {
  const providerErrors = [];

  try {
    const { audioData, audioMimeType } = req.body;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const openAiApiKey = process.env.OPENAI_API_KEY;

    if (!openAiApiKey && !geminiApiKey) {
      return res.status(500).json({
        success: false,
        message:
          'Voice input needs a transcription provider. Add OPENAI_API_KEY or GEMINI_API_KEY in backend/.env and restart the backend.',
      });
    }

    if (!audioData || !audioMimeType) {
      return res.status(400).json({
        success: false,
        message: 'Audio data is required.',
      });
    }

    if (Buffer.byteLength(audioData, 'base64') > MAX_AUDIO_BASE64_BYTES) {
      return res.status(413).json({
        success: false,
        message: 'Voice note is too long. Please keep it under 12 seconds and try again.',
      });
    }

    let cleanTranscript = '';
    let usedProvider = '';

    if (openAiApiKey) {
      try {
        cleanTranscript = await callOpenAiTranscription({
          apiKey: openAiApiKey,
          audioData,
          audioMimeType,
        });
        usedProvider = 'openai';
      } catch (openAiError) {
        providerErrors.push({ provider: 'openai', error: openAiError });
        console.error('OpenAI transcription error:', openAiError.response?.data || openAiError.message);
      }
    }

    if (!cleanTranscript && geminiApiKey) {
      try {
        cleanTranscript = await callGeminiTranscription({
          apiKey: geminiApiKey,
          audioData,
          audioMimeType,
        });
        usedProvider = 'gemini';
      } catch (geminiError) {
        providerErrors.push({ provider: 'gemini', error: geminiError });
        console.error('Gemini transcription error:', geminiError.response?.data || geminiError.message);
      }
    }

    if (!cleanTranscript) {
      const exhaustedQuota = providerErrors.some(({ error }) => isGeminiQuotaError(error));
      return res.status(400).json({
        success: false,
        message:
          providerErrors.length > 0
            ? exhaustedQuota
              ? 'Voice transcription quota is exhausted. Add OPENAI_API_KEY or use a Gemini key/model with quota, then restart the backend.'
              : 'Voice input could not be transcribed by the configured provider. Please type your message or try again.'
            : 'No speech was detected. Try speaking a little closer to the microphone.',
      });
    }

    return res.json({
      success: true,
      transcript: cleanTranscript,
      provider: usedProvider,
    });
  } catch (error) {
    const providerError = error.response?.data?.error?.message || error.response?.data?.message;
    console.error('Assistant transcription error:', error.response?.data || error.message);
    if (isGeminiQuotaError(error)) {
      return res.status(429).json({
        success: false,
        message:
          'Voice transcription quota is exhausted for Gemini. Please type your message for now, or update GEMINI_API_KEY/GEMINI_MODEL in backend/.env and restart the backend.',
      });
    }

    return res.status(500).json({
      success: false,
      message: providerError
        ? 'Voice input could not be transcribed by the AI provider. Please try again.'
        : 'Voice input could not be transcribed. Please try again.',
    });
  }
};

const callOpenRouter = async ({
  apiKey,
  userRole,
  message,
  history,
  imageData,
  imageMimeType,
  model = OPENROUTER_MODEL,
  fallbackModels = [],
}) => {
  const systemInstruction = buildSystemInstruction(userRole);
  const userContent = [];

  if (message && String(message).trim()) {
    userContent.push({
      type: 'text',
      text: String(message).trim(),
    });
  } else if (imageData && imageMimeType) {
    userContent.push({
      type: 'text',
      text: 'Please analyze this image and describe any crop, disease, defect, packaging, or visible issue.',
    });
  }

  if (imageData && imageMimeType) {
    userContent.push({
      type: 'image_url',
      image_url: {
        url: `data:${imageMimeType};base64,${imageData}`,
      },
    });
  }

  const messages = [
    { role: 'system', content: systemInstruction },
    ...(Array.isArray(history)
      ? history
          .filter((item) => item && item.content && item.role)
          .slice(-8)
          .map((item) => ({
            role: item.role === 'assistant' ? 'assistant' : 'user',
            content: String(item.content),
          }))
      : []),
    {
      role: 'user',
      content:
        userContent.length > 0
          ? userContent
          : [{ type: 'text', text: 'Please analyze the attached image.' }],
    },
  ];

  const response = await axios.post(
    OPENROUTER_API_BASE,
    {
      model,
      models: fallbackModels.length > 0 ? fallbackModels : undefined,
      messages,
      temperature: 0.7,
      max_tokens: 512,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 30000,
    }
  );

  if (response.data?.error) {
    const requestError = new Error(response.data.error.message || 'OpenRouter request failed.');
    requestError.response = { data: response.data };
    throw requestError;
  }

  const reply = extractOpenRouterReply(response.data);
  if (!reply) {
    const emptyReplyError = new Error('OpenRouter returned no reply.');
    emptyReplyError.response = {
      data: {
        error: {
          message: 'OpenRouter returned no reply.',
          metadata: {
            raw: response.data,
          },
        },
      },
    };
    throw emptyReplyError;
  }

  return reply;
};

const tryOpenRouterForImage = async ({ apiKey, userRole, message, history, imageData, imageMimeType }) => {
  const visionModels = getConfiguredOpenRouterVisionModels();
  let lastError = null;

  for (const model of visionModels) {
    try {
      const reply = await callOpenRouter({
        apiKey,
        userRole,
        message,
        history,
        imageData,
        imageMimeType,
        model,
        fallbackModels: visionModels.filter((fallbackModel) => fallbackModel !== model),
      });

      if (!isImageCapabilityFailure(reply)) {
        return reply;
      }

      lastError = new Error(`OpenRouter model ${model} did not analyze the image.`);
    } catch (error) {
      lastError = error;
      console.error('OpenRouter image error:', error.response?.data || error.message);
    }
  }

  const visionError = lastError || new Error('No OpenRouter vision model could analyze the image.');
  visionError.response = visionError.response || {
    data: {
      error: {
        message:
          'The configured OpenRouter vision model could not analyze the uploaded image. Set OPENROUTER_VISION_MODELS to a vision-capable model.',
      },
    },
  };
  throw visionError;
};

const chatWithAssistant = async (req, res) => {
  const providerErrors = [];

  try {
    const { message, history = [], imageData, imageMimeType } = req.body;
    const userRole = req.user?.role || 'farmer';
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;

    if (!geminiApiKey && !openRouterApiKey) {
      return res.status(500).json({
        success: false,
        message: 'No AI provider key configured. Add GEMINI_API_KEY or OPENROUTER_API_KEY.',
      });
    }

    const hasText = Boolean(message && String(message).trim());
    const hasImage = Boolean(imageData && imageMimeType);

    if (!hasText && !hasImage) {
      return res.status(400).json({
        success: false,
        message: 'Message or image is required.',
      });
    }

    const mappedHistory = Array.isArray(history)
      ? history
          .filter((item) => item && item.content && item.role)
          .slice(-8)
          .map((item) => ({
            role: item.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: String(item.content) }],
          }))
      : [];

    const userParts = [];
    if (hasText) {
      userParts.push({ text: String(message).trim() });
    } else if (hasImage) {
      userParts.push({
        text: 'Please analyze this image and describe any crop, disease, defect, packaging, or visible issue.',
      });
    }
    if (hasImage) {
      userParts.push({
        inlineData: {
          mimeType: imageMimeType,
          data: imageData,
        },
      });
    }

    const payload = {
      systemInstruction: {
        parts: [{ text: buildSystemInstruction(userRole) }],
      },
      contents: [
        ...mappedHistory,
        {
          role: 'user',
          parts: userParts,
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    };

    let text = '';
    let usedProvider = '';

    if (hasImage && openRouterApiKey) {
      try {
        text = await tryOpenRouterForImage({
          apiKey: openRouterApiKey,
          userRole,
          message,
          history,
          imageData,
          imageMimeType,
        });
        usedProvider = 'openrouter';
      } catch (openRouterImageError) {
        providerErrors.push({ provider: 'openrouter', error: openRouterImageError });
      }

      if (!text && geminiApiKey) {
        try {
          text = await callGemini({ apiKey: geminiApiKey, payload });
          usedProvider = 'gemini';
        } catch (geminiImageError) {
          providerErrors.push({ provider: 'gemini', error: geminiImageError });
          throw geminiImageError;
        }
      }

      if (!text) {
        throw providerErrors[providerErrors.length - 1]?.error || new Error('Image analysis failed.');
      }
    } else if (hasImage && geminiApiKey) {
      text = await callGemini({ apiKey: geminiApiKey, payload });
      usedProvider = 'gemini';
    } else if (openRouterApiKey) {
      text = await callOpenRouter({
        apiKey: openRouterApiKey,
        userRole,
        message,
        history,
        imageData,
        imageMimeType,
        model: OPENROUTER_MODEL,
      });
      usedProvider = 'openrouter';
    } else if (geminiApiKey) {
      text = await callGemini({ apiKey: geminiApiKey, payload });
      usedProvider = 'gemini';
    }

    if (!text) {
      text = "I'm here to help. Please try asking in a different way.";
    }

    return res.json({
      success: true,
      assistantName: getAssistantName(userRole),
      reply: text,
      provider: usedProvider,
    });
  } catch (error) {
    const providerError = error.response?.data?.error?.message || error.response?.data?.message;
    const providerName = error.response?.data?.error?.metadata?.provider_name;
    const genericProviderError = providerError === 'Provider returned error';
    console.error('Assistant chat error:', error.response?.data || error.message);
    const imageProviderFailed = providerErrors.length > 0;
    const quotaFailed = providerErrors.some(({ error: providerFailure }) => isGeminiQuotaError(providerFailure)) || isGeminiQuotaError(error);

    return res.status(500).json({
      success: false,
      message:
        imageProviderFailed
          ? quotaFailed
            ? 'Image analysis quota is exhausted for the configured provider. Set OPENROUTER_VISION_MODELS to a vision-capable model or use a Gemini key/model with quota.'
            : 'Image analysis could not be completed by the configured provider. Please try another image or update the vision model setting.'
          : !genericProviderError && providerError && !quotaFailed
            ? providerError
            : providerName
              ? `Provider ${providerName} returned an error. Please try again.`
              : quotaFailed
                ? 'AI provider quota is exhausted. Please update the provider key/model or try again later.'
                : 'The AI provider returned an error. Please try again.',
    });
  }
};

export default {
  chatWithAssistant,
  transcribeAudio,
};
