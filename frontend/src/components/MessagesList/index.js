import React, { useState, useEffect, useReducer, useRef, useContext } from "react";

import { isSameDay, parseISO, format } from "date-fns";
import openSocket from "../../services/socket-io";
import openSQSSocket from "../../services/socket-sqs-io";
import clsx from "clsx";

import { green, red } from "@material-ui/core/colors";
import {
  Button,
  CircularProgress,
  Divider,
  IconButton,
  makeStyles,
  Tooltip,
  Typography,
} from "@material-ui/core";
import {
  AccessTime,
  Block,
  Done,
  DoneAll,
  ExpandMore,
  GetApp,
  Replay,
} from "@material-ui/icons";
import CloseIcon from '@material-ui/icons/Close';

import MarkdownWrapper from "../MarkdownWrapper";
import VcardPreview from "../VcardPreview";
import LocationPreview from "../LocationPreview";
import ModalImageCors from "../ModalImageCors";
import ModalMediaCors from "../ModalMediaCors";
import MessageOptionsMenu from "../MessageOptionsMenu";
import whatsBackground from "../../assets/wa-background.png";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { i18n } from "../../translate/i18n";
import ModalAudioCors from "../ModalAudioCors";
import ModalVideoCors from "../ModalVideoCors";

const useStyles = makeStyles((theme) => ({
  messagesListWrapper: {
    overflow: "hidden",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
  },

  messagesList: {
    backgroundImage: `url(${whatsBackground})`,
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    padding: "20px 20px 20px 20px",
    overflowY: "scroll",
    [theme.breakpoints.down("sm")]: {
      paddingBottom: "90px",
    },
    ...theme.scrollbarStyles,
  },

  circleLoading: {
    color: green[500],
    position: "absolute",
    opacity: "70%",
    top: 0,
    left: "50%",
    marginTop: 12,
  },

  messageLeft: {
    marginRight: 20,
    marginTop: 2,
    minWidth: 100,
    maxWidth: 600,
    height: "auto",
    display: "block",
    position: "relative",
    "&:hover #messageActionsButton": {
      display: "flex",
      position: "absolute",
      top: 0,
      right: 0,
    },

    whiteSpace: "pre-wrap",
    backgroundColor: "#ffffff",
    color: "#303030",
    alignSelf: "flex-start",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 0,
    boxShadow: "0 1px 1px #b3b3b3",
  },

  quotedContainerLeft: {
    margin: "-3px -80px 6px -6px",
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    borderRadius: "7.5px",
    display: "flex",
    position: "relative",
  },

  quotedMsg: {
    padding: 10,
    maxWidth: 300,
    height: "auto",
    display: "block",
    whiteSpace: "pre-wrap",
    overflow: "hidden",
  },

  quotedSideColorLeft: {
    flex: "none",
    width: "4px",
    backgroundColor: "#6bcbef",
  },

  messageRight: {
    marginLeft: 20,
    marginTop: 2,
    minWidth: 150,
    maxWidth: 600,
    height: "auto",
    display: "block",
    position: "relative",
    "&:hover #messageActionsButton": {
      display: "flex",
      position: "absolute",
      top: 0,
      right: 0,
    },

    whiteSpace: "pre-wrap",
    backgroundColor: "#dcf8c6",
    color: "#303030",
    alignSelf: "flex-end",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 0,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 0,
    boxShadow: "0 1px 1px #b3b3b3",
  },

  quotedContainerRight: {
    margin: "-3px -80px 6px -6px",
    overflowY: "hidden",
    backgroundColor: "#cfe9ba",
    borderRadius: "7.5px",
    display: "flex",
    position: "relative",
  },

  quotedMsgRight: {
    padding: 10,
    maxWidth: 300,
    height: "auto",
    whiteSpace: "pre-wrap",
  },

  quotedSideColorRight: {
    flex: "none",
    width: "4px",
    backgroundColor: "#35cd96",
  },

  messageActionsButton: {
    display: "none",
    position: "relative",
    color: "#999",
    zIndex: 1,
    backgroundColor: "inherit",
    opacity: "90%",
    "&:hover, &.Mui-focusVisible": { backgroundColor: "inherit" },
  },

  messageContactName: {
    display: "flex",
    color: "#6bcbef",
    fontWeight: 500,
  },

  textContentItem: {
    overflowWrap: "break-word",
    padding: "3px 80px 18px 6px",
  },

  textContentItemDeleted: {
    fontStyle: "italic",
    color: "rgba(0, 0, 0, 0.36)",
    overflowWrap: "break-word",
    padding: "3px 80px 18px 6px",
  },

  messageMedia: {
    objectFit: "cover",
    width: 250,
    height: 200,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },

  timestamp: {
    fontSize: 11,
    position: "absolute",
    bottom: 0,
    right: 5,
    color: "#999",
  },

  timestampUser: {
    fontSize: 12,
    position: "absolute",
    top: 0,
    right: 5,
    color: "#999",
  },

  dailyTimestamp: {
    alignItems: "center",
    textAlign: "center",
    alignSelf: "center",
    width: "110px",
    backgroundColor: "#e1f3fb",
    margin: "10px",
    borderRadius: "10px",
    boxShadow: "0 1px 1px #b3b3b3",
  },

  transferTimestamp: {
    alignItems: "center",
    textAlign: "center",
    alignSelf: "center",
    width: "220px",
    backgroundColor: "#e1f3fb",
    margin: "10px",
    borderRadius: "10px",
    boxShadow: "0 1px 1px #b3b3b3",
  },

  dailyTimestampText: {
    color: "#808888",
    padding: 8,
    alignSelf: "center",
    marginLeft: "0px",
  },

  ackIcons: {
    fontSize: 18,
    verticalAlign: "middle",
    marginLeft: 4,
  },

  deletedIcon: {
    fontSize: 18,
    verticalAlign: "middle",
    marginRight: 4,
  },

  ackDoneAllIcon: {
    color: green[500],
    fontSize: 18,
    verticalAlign: "middle",
    marginLeft: 4,
  },

  ackErrorIcon: {
    color: red[500],
    fontSize: 18,
    verticalAlign: "middle",
    marginLeft: 4,
  },

  downloadMedia: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "inherit",
    padding: 10,
  },
}));

const reducer = (state, action) => {
  if (action.type === "LOAD_MESSAGES") {
    const messages = action.payload;
    const newMessages = [];

    messages.forEach((message) => {
      const messageIndex = state.findIndex((m) => m.id === message.id);
      if (messageIndex !== -1) {
        state[messageIndex] = message;
      } else {
        newMessages.push(message);
      }
    });

    return [...newMessages, ...state];
  }

  if (action.type === "ADD_MESSAGE") {
    const newMessage = action.payload;
    const messageIndex = state.findIndex((m) => m.id === newMessage.id);

    if (messageIndex !== -1) {
      state[messageIndex] = newMessage;
    } else {
      state.push(newMessage);
    }

    return [...state];
  }

  if (action.type === "UPDATE_MESSAGE") {
    const messageToUpdate = action.payload;
    const messageIndex = state.findIndex((m) => m.id === messageToUpdate.id);

    if (messageIndex !== -1) {
      state[messageIndex] = messageToUpdate;
    }

    return [...state];
  }

  if (action.type === "UPDATE_MESSAGE_ID") {
    const oldId = action.payload.oldId;
    const messageToUpdate = action.payload.message;
    const messageIndex = state.findIndex((m) => m.id === oldId);

    if (messageIndex !== -1) {
      state[messageIndex] = messageToUpdate;
    }

    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const MessagesList = ({ ticketId, isGroup, whatsapp }) => {
  const classes = useStyles();

  const [messagesList, dispatch] = useReducer(reducer, []);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const lastMessageRef = useRef();

  const [selectedMessage, setSelectedMessage] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const messageOptionsMenuOpen = Boolean(anchorEl);
  const currentTicketId = useRef(ticketId);
  const { user } = useContext(AuthContext);

  // const [ticketHistoric, setTicketHistoric] = useState([]);
  // const transferList = [];

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);

    currentTicketId.current = ticketId;
  }, [ticketId]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchMessages = async () => {
        try {
          const { data } = await api.get("/messages/" + ticketId, {
            params: { pageNumber },
          });

          if (currentTicketId.current === ticketId) {
            dispatch({ type: "LOAD_MESSAGES", payload: data.messages });
            setHasMore(data.hasMore);
            setLoading(false);
          }

          if (pageNumber === 1 && data.messages.length > 1) {
            scrollToBottom();
          }

          // setTicketHistoric(data.historic);
        } catch (err) {
          setLoading(false);
          toastError(err);
        }
      };
      fetchMessages();
    }, 500);
    return () => {
      clearTimeout(delayDebounceFn);
    };
  }, [pageNumber, ticketId]);

  useEffect(() => {
    const socket = openSocket();

    socket.on("connect", () => socket.emit("joinChatBox", ticketId));

    socket.on(`appMessage${user.companyId}`, (data) => {
      if (data.action === "create") {
        dispatch({ type: "ADD_MESSAGE", payload: data.message });
        scrollToBottom();
      }

      if (data.action === "update") {
        if (data.oldId) {
          dispatch({ type: "UPDATE_MESSAGE_ID", payload: data });
        } else {
          dispatch({ type: "UPDATE_MESSAGE", payload: data.message });
        }
      }
    });

    socket.on(`whatsapp-message${user.companyId}`, (data) => {
      if (data.action === "update") {
        dispatch({ type: "UPDATE_MESSAGE", payload: data.message });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, ticketId]);

  useEffect(() => {
    const socket = openSQSSocket();

    socket.on("connect", () => socket.emit("joinChatBox", ticketId));

    socket.on(`appMessage${user.companyId}`, (data) => {
      if (data.action === "create") {
        dispatch({ type: "ADD_MESSAGE", payload: data.message });
        scrollToBottom();
      }

      if (data.action === "update") {
        if (data.oldId) {
          dispatch({ type: "UPDATE_MESSAGE_ID", payload: data });
        } else {
          dispatch({ type: "UPDATE_MESSAGE", payload: data.message });
        }
      }
    });

    socket.on(`whatsapp-message${user.companyId}`, (data) => {
      if (data.action === "update") {
        dispatch({ type: "UPDATE_MESSAGE", payload: data.message });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, ticketId]);

  const loadMore = () => {
    setPageNumber((prevPageNumber) => prevPageNumber + 1);
  };

  const scrollToBottom = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({});
    }
  };

  const handleScroll = (e) => {
    if (!hasMore) return;
    const { scrollTop } = e.currentTarget;

    if (scrollTop === 0) {
      document.getElementById("messagesList").scrollTop = 1;
    }

    if (loading) {
      return;
    }

    if (scrollTop < 50) {
      loadMore();
    }
  };

  const handleOpenMessageOptionsMenu = (e, message) => {
    setAnchorEl(e.currentTarget);
    setSelectedMessage(message);
  };

  const handleCloseMessageOptionsMenu = (e) => {
    setAnchorEl(null);
  };

  const checkMessageMedia = (message) => {
	if(message.mediaType === "location" && message.body.split('|').length >= 2) {
		let locationParts = message.body.split('|')
		let imageLocation = locationParts[0]
		let linkLocation = locationParts[1]

		let descriptionLocation = null

		if(locationParts.length > 2)
			descriptionLocation = message.body.split('|')[2]

		return <LocationPreview image={imageLocation} link={linkLocation} description={descriptionLocation} />
	}
	else if (message.mediaType === "vcard") {
		//console.log("vcard")
		//console.log(message)
		let array = message.body.split("\n");
		let obj = [];
		let contact = "";
		for (let index = 0; index < array.length; index++) {
			const v = array[index];
			let values = v.split(":");
			for (let ind = 0; ind < values.length; ind++) {
				if (values[ind].indexOf("+") !== -1) {
					obj.push({ number: values[ind] });
				}
				if (values[ind].indexOf("FN") !== -1) {
					contact = values[ind + 1];
				}
			}
		}
		return <VcardPreview contact={contact} numbers={obj[0].number} />
	}
  /*else if (message.mediaType === "multi_vcard") {
		console.log("multi_vcard")
		console.log(message)

		if(message.body !== null && message.body !== "") {
			let newBody = JSON.parse(message.body)
			return (
				<>
				  {
					newBody.map(v => (
					  <VcardPreview contact={v.name} numbers={v.number} />
					))
				  }
				</>
			)
		} else return (<></>)
	}*/
  else if (message.mediaType === "image" || message.mediaType === "buttons") {
      return <ModalImageCors imageUrl={message.mediaUrl} />;
    } else if (message.mediaType === "audio") {
      return (
        <audio controls>
					<source src={message.mediaUrl} type="audio/ogg"></source>
				</audio>
      );
      // return <ModalAudioCors audioUrl={message.mediaUrl} />;
    } else if (message.mediaType === "video") {
      return (
        <video
					className={classes.messageMedia}
					src={message.mediaUrl}
					controls
				/>
      );
      // return <ModalVideoCors videoUrl={message.mediaUrl} />;
    } else if (message.mediaType === "text") {
      return (
        <div 
          style={{ 
            overflowWrap: "break-word",
            padding: "0px 80px 0px 6px", 
          }}
        >
          <MarkdownWrapper>{message.mediaUrl}</MarkdownWrapper>
        </div>
      );
    } else {
      return (
        <>
          <div className={classes.downloadMedia}>
            <Button
              startIcon={<GetApp />}
              color="primary"
              variant="outlined"
              target="_blank"
              href={message.mediaUrl}
            >
             {i18n.t("locationPreview.download")}
            </Button>
          </div>
          <Divider />
        </>
      )
      // return <ModalMediaCors mediaUrl={message.mediaUrl} />;
    }
  };

  const renderMessageAck = (message) => {
    if (message.ack === 0) {
      return <AccessTime fontSize="small" className={classes.ackIcons} />;
    }
    if (message.ack === 1) {
      return <Done fontSize="small" className={classes.ackIcons} />;
    }
    if (message.ack === 2) {
      return <DoneAll fontSize="small" className={classes.ackIcons} />;
    }
    if (message.ack === 3 || message.ack === 4) { // || message.ack === 4
      return <DoneAll fontSize="small" className={classes.ackDoneAllIcon} />;
    }
    if (message.ack === 5) {
      return <CloseIcon fontSize="small" className={classes.ackErrorIcon} />
    }
  };

  const renderDailyTimestamps = (message, index) => {
    if (index === 0) {
      return (
        <span
          className={classes.dailyTimestamp}
          key={`timestamp-${message.id}`}
        >
          <div className={classes.dailyTimestampText}>
            {format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy")}
          </div>
        </span>
      );
    }
    if (index < messagesList.length - 1) {
      let messageDay = parseISO(messagesList[index].createdAt);
      let previousMessageDay = parseISO(messagesList[index - 1].createdAt);

      if (!isSameDay(messageDay, previousMessageDay)) {
        return (
          <span
            className={classes.dailyTimestamp}
            key={`timestamp-${message.id}`}
          >
            <div className={classes.dailyTimestampText}>
              {format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy")}
            </div>
          </span>
        );
      }
    }
    if (index === messagesList.length - 1) {
      return (
        <div
          key={`ref-${message.createdAt}`}
          ref={lastMessageRef}
          style={{ float: "left", clear: "both" }}
        />
      );
    }
  };

  const renderMessageDivider = (message, index) => {
    if (index < messagesList.length && index > 0) {
      let messageUser = messagesList[index].fromMe;
      let previousMessageUser = messagesList[index - 1].fromMe;

      if (messageUser !== previousMessageUser) {
        return (
          <span style={{ marginTop: 16 }} key={`divider-${message.id}`}></span>
        );
      }
    }
  };

  const renderQuotedMessage = (message) => {
    return (
      <div
        className={clsx(classes.quotedContainerLeft, {
          [classes.quotedContainerRight]: message.fromMe,
        })}
      >
        <span
          className={clsx(classes.quotedSideColorLeft, {
            [classes.quotedSideColorRight]: message.quotedMsg?.fromMe,
          })}
        ></span>
        <div className={classes.quotedMsg}>
          {!message.quotedMsg?.fromMe && (
            <span className={classes.messageContactName}>
              {message.quotedMsg?.contact?.name}
            </span>
          )}
          {message.quotedMsg?.body}
        </div>
      </div>
    );
  };

  const renderFooter = (message) => {
    const footer = JSON.parse(message.footer);
    if (!footer) return "";

    return (
      <div style={{ marginTop: "2px", flexWrap: "wrap" }}>
        {footer.text && <MarkdownWrapper>{footer.text}</MarkdownWrapper>}
        {footer.buttons && footer.buttons.map(button => {
          let text = "";
          let tooltip = "";

          if (button.urlButton) {
            text = button.urlButton.displayText;
            tooltip = "LINK: " + button.urlButton.url;
          }

          if (button.callButton) {
            text = button.callButton.displayText;
            tooltip = "PHONE NUMBER: " + button.callButton.phoneNumber;
          }

          if (button.quickReplyButton) {
            text = button.quickReplyButton.displayText;
            tooltip = "ID: " + button.quickReplyButton.id;
          }

          return (
            <Tooltip title={tooltip}>
              <Button
                key={button.index}
                variant="outlined"
                style={{ margin: "2px" }}
                fullWidth
              >
                {text}
              </Button>
            </Tooltip>
          )
        })}
      </div>
    );
  }

  const renderTransferTimestamps = (message, index) => {
    // if (index === 0) {}

    // if (index < messagesList.length - 1) {
    //   const date1 = parseISO(messagesList[index].createdAt);
    //   const date2 = parseISO(messagesList[index + 1].createdAt);

    //   const historics = ticketHistoric.filter(historic => {
    //     const historicDate = parseISO(historic.transferedAt);

    //     return (date1 < historicDate && historicDate < date2);
    //   });

    //   return (
    //     <>
    //       {historics.map(historic => {
    //         if (!transferList.includes[historic.id]) {
    //           transferList.push(historic.id);
    //           transferList.push(historic.id + 1);

    //           return (
    //             <span
    //               className={classes.transferTimestamp}
    //               key={`transfer-timestamp-${message.id}`}
    //             >
    //               <div className={classes.dailyTimestampText}>
    //                 Transferido: <br />
    //                 Fila: {historic.queue ? historic.queue.name : "SEM FILA"} <br />
    //                 User: {historic.user ? historic.user.name : "SEM USER"} <br />
    //                 {format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy HH:mm")}
    //               </div>
    //             </span>
    //           )
    //         }
    //       })}
    //     </>
    //   );
    // }

    // if (index === messagesList.length - 1) {}
  }

  const renderTicket = (message, index) => {
    if (index === 0) {
      return (
        <span
          className={classes.dailyTimestamp}
          key={`ticket-${message.id}`}
        >
          <div className={classes.dailyTimestampText}>
            TICKET: {message.ticketId}
          </div>
        </span>
      );
    }
    if (index < messagesList.length) {
      let messageTicket = messagesList[index].ticketId;
      let previousMessageTicket = messagesList[index - 1].ticketId;

      if (messageTicket != previousMessageTicket) {
        return (
          <span
            className={classes.dailyTimestamp}
            key={`ticket-${message.id}`}
          >
            <div className={classes.dailyTimestampText}>
              TICKET: {message.ticketId}
            </div>
          </span>
        );
      }
    }
  }

  const renderMessages = () => {
    if (messagesList.length > 0) {
      const viewMessagesList = messagesList.map((message, index) => {
        if (!message.fromMe) {
          return (
            <React.Fragment key={message.id}>
              {renderTicket(message, index)}
              {renderDailyTimestamps(message, index)}
              {renderMessageDivider(message, index)}
              <div className={classes.messageLeft}>
                <IconButton
                  variant="contained"
                  size="small"
                  id="messageActionsButton"
                  disabled={message.isDeleted}
                  className={classes.messageActionsButton}
                  onClick={(e) => handleOpenMessageOptionsMenu(e, message)}
                >
                  <ExpandMore />
                </IconButton>
                {isGroup && (
                  <span className={classes.messageContactName}>
                    {message.author}
                  </span>
                )}
                {(message.mediaUrl || message.mediaType === "location" || message.mediaType === "vcard"
                //|| message.mediaType === "multi_vcard"
                ) && checkMessageMedia(message)}
                <div className={classes.textContentItem}>
                  {message.quotedMsg && renderQuotedMessage(message)}
                  <MarkdownWrapper>{message.body}</MarkdownWrapper>
                  <span className={classes.timestamp}>
                    {format(parseISO(message.createdAt), "dd/MM/yyyy HH:mm")}
                  </span>
                </div>
              </div>
              {/* {renderTransferTimestamps(message, index)} */}
            </React.Fragment>
          );
        } else {
          return (
            <React.Fragment key={message.id}>
              {renderTicket(message, index)}
              {renderDailyTimestamps(message, index)}
              {renderMessageDivider(message, index)}
              <div className={classes.messageRight}>
                <IconButton
                  variant="contained"
                  size="small"
                  id="messageActionsButton"
                  disabled={message.isDeleted}
                  className={classes.messageActionsButton}
                  onClick={(e) => handleOpenMessageOptionsMenu(e, message)}
                >
                  <ExpandMore />
                </IconButton>
                {(message.mediaUrl || message.mediaType === "location" || message.mediaType === "vcard"
                //|| message.mediaType === "multi_vcard"
                ) && checkMessageMedia(message)}
                <div
                  className={clsx(classes.textContentItem, {
                    [classes.textContentItemDeleted]: message.isDeleted,
                  })}
                >
                  {message.isDeleted && (
                    <Block
                      color="disabled"
                      fontSize="small"
                      className={classes.deletedIcon}
                    />
                  )}
                  {message.quotedMsg && renderQuotedMessage(message)}
                  <MarkdownWrapper>{message.body}</MarkdownWrapper>
                  {message.footer && renderFooter(message)}
                  <span className={classes.timestamp}>
                    {format(parseISO(message.createdAt), "dd/MM/yyyy - HH:mm")}
                    {renderMessageAck(message)}
                  </span>
                  <span className={classes.timestampUser}>
                    {message?.user?.nickname || message?.user?.name}
                  </span>
                </div>
              </div>
              {/* {renderTransferTimestamps(message, index)} */}
            </React.Fragment>
          );
        }
      });
      return viewMessagesList;
    } else {
      return <div>{i18n.t("locationPreview.hello")}</div>;
    }
  };

  return (
    <div className={classes.messagesListWrapper}>
      <MessageOptionsMenu
        message={selectedMessage}
        anchorEl={anchorEl}
        menuOpen={messageOptionsMenuOpen}
        handleClose={handleCloseMessageOptionsMenu}
        whatsapp={whatsapp}
      />
      <div
        id="messagesList"
        className={classes.messagesList}
        onScroll={handleScroll}
      >
        {messagesList.length > 0 ? renderMessages() : []}
      </div>
      {loading && (
        <div>
          <CircularProgress className={classes.circleLoading} />
        </div>
      )}
    </div>
  );
};

export default MessagesList;