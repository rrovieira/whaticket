import AppError from "../../errors/AppError";
import ChatbotOption from "../../models/ChatbotOption";

const ShowChatbotOptionService = async (id: string): Promise<ChatbotOption> => {
  const chatbotOption = await ChatbotOption.findByPk(id, {
    include: ["chatbotOptions"]
  });

  if (!chatbotOption) {
    throw new AppError("ERR_NO_CHATBOT_OPTION_FOUND", 404);
  }

  return chatbotOption;
};

export default ShowChatbotOptionService;
