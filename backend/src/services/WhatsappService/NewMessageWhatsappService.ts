import * as Yup from "yup";
import * as Sentry from "@sentry/node";

import AppError from "../../errors/AppError";
import Contact from "../../database/models/Contact";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import { logger } from "../../utils/logger";
import Ticket from "../../database/models/Ticket";
import CreateMessageService from "../MessageServices/CreateMessageService";
import CreateOrUpdateContactService from "../ContactServices/CreateOrUpdateContactService";
import Whatsapp from "../../database/models/Whatsapp";
import FileRegister from "../../database/models/FileRegister";

interface Request {
  id: string;
  fromMe: boolean;
  isGroup: boolean;
  type: string;
  to: string;
  from: string;
  body: string;
  contactName: string;
  session: string;
  identification: number;
  companyId: number;
}

interface Response {
  success: boolean;
}

const GetWhatsappByIdentification = async (
  identification: number
): Promise<Whatsapp> => {
  const whatsapp = await Whatsapp.findOne({
    where: {
      facebookBusinessId: identification
    }
  });

  return whatsapp;
};

const GetWhatsappBySession = async (session: string): Promise<Whatsapp> => {
  const whatsapp = await Whatsapp.findOne({
    where: {
      name: session
    }
  });

  return whatsapp;
};

const NewMessageWhatsappService = async ({
  id,
  fromMe,
  isGroup,
  type,
  to,
  from,
  body,
  contactName,
  identification,
  session,
  companyId
}: Request): Promise<Response> => {
  const schema = Yup.object().shape({
    id: Yup.string().required(),
    fromMe: Yup.string().required(),
    body: Yup.string().required(),
    from: Yup.string().required(),
    to: Yup.string().required(),
    type: Yup.string().required(),
    isGroup: Yup.boolean().required()
  });

  try {
    await schema.validate({
      id,
      fromMe,
      body,
      from,
      to,
      type,
      isGroup
    });
  } catch (err) {
    throw new AppError(err.message);
  }
  // eslint-disable-next-line no-use-before-define
  await handleMessage(
    id,
    fromMe,
    body,
    from,
    to,
    type,
    contactName,
    isGroup,
    identification,
    session,
    companyId
  );
  return { success: true };
};

const verifyMessage = async (
  msg: {
    id: string;
    fromMe: boolean;
    body: string;
    from: string;
    to: string;
    type: string;
    isGroup: boolean;
  },
  ticket: Ticket,
  contact: Contact
) => {

  const messageData = {
    id: msg.id,
    ticketId: ticket.id,
    contactId: msg.fromMe ? undefined : contact.id,
    body: msg.body,
    fromMe: msg.fromMe,
    mediaType: msg.type,
    read: msg.fromMe
  };

  await ticket.update({ lastMessage: msg.body });

  await CreateMessageService({ messageData });
};

const verifyContact = async (
  contactName: string,
  contactNumber: string,
  companyId: number
): Promise<Contact> => {
  if (contactName == '') {
    const contact = await FileRegister.findAll({ where: { phoneNumber: contactNumber, companyId }, limit: 1 });
    if (contact.length > 0)
      contactName = contact[0].name;
  }

  const contactData = {
    name: contactName,
    number: contactNumber,
    isGroup: false
  };

  const contact = CreateOrUpdateContactService(contactData);

  return contact;
}


const handleMessage = async (
  id: string,
  fromMe: boolean,
  body: string,
  from: string,
  to: string,
  type: string,
  contactName: string,
  isGroup: boolean,
  identification: number,
  session: string,
  companyId: number
): Promise<void> => {
  try {
    const unreadMessages = 1;
    const contact = await verifyContact(contactName, from, companyId);
    let whatsapp: Whatsapp;
    if (identification) {
      whatsapp = await GetWhatsappByIdentification(identification);
    }
    if (session) {
      whatsapp = await GetWhatsappBySession(session);
    }
    // eslint-disable-next-line no-throw-literal
    if (!whatsapp) throw "number identification not found";

    const ticket = await FindOrCreateTicketService(
      contact,
      whatsapp.id,
      whatsapp.companyId,
      unreadMessages
    );

    if (type !== "text") {
      //await verifyMediaMessage(msg, ticket, contact);
    } else {
      await verifyMessage(
        {
          id,
          fromMe,
          body,
          from,
          to,
          type,
          isGroup
        },
        ticket,
        contact
      );
    }
  } catch (err) {
    Sentry.captureException(err);
    logger.error(`Error handling whatsapp message: Err: ${err}`);
  }
};

export default NewMessageWhatsappService;
