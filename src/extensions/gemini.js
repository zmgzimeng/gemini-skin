(function (Scratch) {
  'use strict';

  const API_KEY = "";
  
  let currentPersonality = "You are the latest Gemini Flash 3.5 model that strictly replies in only plain text, not markdown formatting.";
  let currentTemperature = 0.5;
  let lastAnswer = "";
  let conversationHistory = [];
  let isContextEnabled = true; // State tracking for context memory

  class GeminiExtension {
    getInfo() {
      return {
        id: 'geminiExtension',
        name: 'Gemini AI',
        blocks: [
          {
            opcode: 'askX',
            blockType: Scratch.BlockType.COMMAND,
            text: 'ask [PROMPT]',
            arguments: {
              PROMPT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Hello'
              }
            }
          },
          {
            opcode: 'getAnswer',
            blockType: Scratch.BlockType.REPORTER,
            text: 'answer',
            arguments: {}
          },
          {
            opcode: 'toggleContext',
            blockType: Scratch.BlockType.COMMAND,
            text: 'turn context memory [STATE]',
            arguments: {
              STATE: {
                type: Scratch.ArgumentType.STRING,
                menu: 'contextMenu',
                defaultValue: 'on'
              }
            }
          },
          {
            opcode: 'isContextOn',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'context on?',
            arguments: {}
          },
          {
            opcode: 'changePersonality',
            blockType: Scratch.BlockType.COMMAND,
            text: 'change personality to [PERSONALITY]',
            arguments: {
              PERSONALITY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'a helpful researcher'
              }
            }
          },
          {
            opcode: 'changeTemperature',
            blockType: Scratch.BlockType.COMMAND,
            text: 'change temperature to [TEMP]',
            arguments: {
              TEMP: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0.5
              }
            }
          },
          {
            opcode: 'clearHistory',
            blockType: Scratch.BlockType.COMMAND,
            text: 'clear chat history',
            arguments: {}
          }
        ],
        menus: {
          contextMenu: {
            acceptReporters: true,
            items: ['on', 'off']
          }
        }
      };
    }

    async askX(args) {
      const prompt = args.PROMPT;

      // Log the user's prompt into the main conversation bank to preserve the timeline
      conversationHistory.push({
        role: "user",
        parts: [{ text: prompt }]
      });

      // Select request contents based on context tracking state
      // If true: send full history array. If false: wrap only the most recent entry.
      const payloadContents = isContextEnabled 
        ? conversationHistory 
        : [conversationHistory[conversationHistory.length - 1]];

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${API_KEY}`;

      try {
        const response = await Scratch.fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: payloadContents,
            systemInstruction: { parts: [{ text: currentPersonality }] },
            generationConfig: {
              temperature: currentTemperature
            }
          }
        )});

        const data = await response.json();

        if (data.candidates && data.candidates[0].content.parts[0].text) {
          lastAnswer = data.candidates[0].content.parts[0].text;
          
          // Log model output to history array so continuity remains unbroken behind the scenes
          conversationHistory.push({
            role: "model",
            parts: [{ text: lastAnswer }]
          });
        } else {
          lastAnswer = "";
        }
      } catch (error) {
        lastAnswer = "";
      }
    }

    getAnswer() {
      return lastAnswer;
    }

    toggleContext(args) {
      isContextEnabled = (args.STATE === 'on');
    }

    isContextOn() {
      return isContextEnabled;
    }

    changePersonality(args) {
      currentPersonality = args.PERSONALITY;
    }

    changeTemperature(args) {
      let temp = parseFloat(args.TEMP);
      if (temp < 0) temp = 0;
      if (temp > 2) temp = 2;
      currentTemperature = temp;
    }

    clearHistory() {
      conversationHistory = [];
    }
  }

  Scratch.extensions.register(new GeminiExtension());
})(Scratch);
