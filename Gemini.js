import { GoogleGenAI } from "@google/genai";

export async function action(data, callback) {

	try {

		const tblActions = {
			getGemini: () => getGemini(data, data.client, callback)
		};

		info("Gemini:", data.action.command, L.get("plugin.from"), data.client);

		if (tblActions[data.action.command]) {
			tblActions[data.action.command]();
		} else {
			warn("Commande Gemini inconnue:", data.action.command);
			callback();
		}

	} catch (err) {

		error("Gemini:", err);

		if (data.client) Avatar.Speech.end(data.client);

		callback();
	}
}

async function getGemini(data, client, callback) {

	try {

		const sentence = (data.rawSentence || data.action.sentence || "").toLowerCase();

		const question = sentence
			.replace(/demande à gemini/gi, "")
			.replace(/gemini/gi, "")
			.replace(/avatar/gi, "")
			.trim();

		if (!question) {

			return Avatar.speak("Je n'ai pas compris votre demande.", client, () => {
				Avatar.Speech.end(client);
				callback();
			});
		}

		info("Question Gemini:", question);

		const apiKey = Config.modules.Gemini.apiKey;

		const ai = new GoogleGenAI({ apiKey });

		const response = await ai.models.generateContent({
			model: "gemini-2.5-flash",
			contents: question
		});

		let reply = response.text;

		if (!reply) reply = "Je ne trouve pas de réponse.";

		// nettoyage pour TTS
		reply = reply
			.replace(/[\*\#\_\`\>\-]/g, "")
			.replace(/\n+/g, " ")
			.trim();

		if (reply.length > 500) reply = reply.substring(0, 500) + "...";

		info("Réponse Gemini:", reply);

		Avatar.speak(reply, client, () => {
			Avatar.Speech.end(client);
			callback();
		});

	} catch (err) {

		error("Gemini API Error:", err);

		Avatar.speak("Désolé, Gemini ne répond pas.", client, () => {
			Avatar.Speech.end(client);
			callback();
		});
	}
}
