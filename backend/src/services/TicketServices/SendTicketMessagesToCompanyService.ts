import { format, parseISO } from "date-fns";
import Message from "../../database/models/Message";
import Ticket from "../../database/models/Ticket";
import FileRegister from "../../database/models/FileRegister";
import axios from "axios";
import Contact from "../../database/models/Contact";
import { Op } from "sequelize";
import { preparePhoneNumber9Digit, removePhoneNumber9Digit, removePhoneNumber9DigitCountry, removePhoneNumberCountry, removePhoneNumberWith9Country } from "../../utils/common";
import Category from "../../database/models/Category";

interface Request {
  ticketId: number;
  companyId: number;
  categoryId?: number;
}

const SendTicketMessagesToCompanyService = async ({
  ticketId,
  categoryId,
  companyId
}: Request): Promise<void> => {
  try {
    let categoryName = "NÃO CATEGORIZADO";

    if (categoryId) {
      const category = await Category.findOne({
        where: { id: categoryId }
      });

      if (category) categoryName = category.name;
    }

    const { count, rows: messages } = await Message.findAndCountAll({
      where: { ticketId },
      include: [
        {
          model: Ticket,
          as: "ticket",
          where: { companyId },
          required: true
        }
      ],
      order: [["createdAt", "ASC"]],
    });
    
    let reg = null;
  
    reg = await FileRegister.findOne({
      where: { msgWhatsId: messages[0].id, companyId },
      order: [["createdAt", "DESC"]]
    });
  
    if (!reg) {
      const contact = await Contact.findOne({
        where: { id: messages[0].ticket.contactId }
      });
  
      reg = await FileRegister.findOne({
        where: {
          phoneNumber: 
          { 
            [Op.or]: [
              removePhoneNumberWith9Country(contact.number),
              preparePhoneNumber9Digit(contact.number),
              removePhoneNumber9Digit(contact.number),
              removePhoneNumberCountry(contact.number),
              removePhoneNumber9DigitCountry(contact.number)
            ],
          },
          companyId: companyId,
          processedAt: { [Op.ne]: null }
        },
        order: [["createdAt", "DESC"]]
      });
    }
  
    let html = "";
  
    html += `<b>Qtde Mensagens:</b>${count}</br>`;
    html += '<i>---------- Mensagens ----------</i>';
  
    for (const message of messages) {
      const message_origin = message.fromMe ? "Operador" : "Cliente";
      const message_content = message.body || message.mediaUrl;
      const message_date = format(message.createdAt, "dd/MM/yyyy HH:mm:ss");
  
      html += `</br><b>${message_origin}: </b>"${message_content}" - <i>${message_date}</i></br>`;
    }
  
    const payload = {
      "token": process.env.BELLINATI_TOKEN,
      "idFornecedor": process.env.BELLINATI_ID_FORNECEDOR,
      "idEventoFornecedor": categoryName,
      "cdGrupo": 999,
      "texto": html,
      "CNPJ_CPF": reg.documentNumber,
      "telefone": reg.phoneNumber,
      "contrato": reg.var1,
      "dadosAdicionais": reg.var2,
      "dataEvento": formatDate(new Date()),
      "var1": reg.var1,
      "var2": reg.var2,
      "var3": reg.var3,
      "var4": reg.var4,
      "var5": reg.var5,
    };
  
    const response = await axios.post(process.env.BELLINATI_URL, payload);

    console.log(response.data);
  } catch (err) {
    console.log(err);
  }
};

const padTo2Digits = (num) => {
	return num.toString().padStart(2, '0');
}

const formatDate = (date) => {
	return (
		[
			date.getFullYear(),
			padTo2Digits(date.getMonth() + 1),
			padTo2Digits(date.getDate()),
		].join('-') +
		'T' +
		[
			padTo2Digits(date.getHours()),
			padTo2Digits(date.getMinutes()),
			padTo2Digits(date.getSeconds()),
		].join(':')
	);
}

export default SendTicketMessagesToCompanyService;
