import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Paper from "@material-ui/core/Paper";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";

import useTickets from "../../hooks/useTickets";

import { AuthContext } from "../../context/Auth/AuthContext";

import Chart from "./Chart";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  fixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: 240,
  },
  customFixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: 120,
  },
  customFixedHeightPaperLg: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: "100%",
  },
}));

const Dashboard = () => {
  const classes = useStyles();
  const { i18n } = useTranslation();
  const { user } = useContext(AuthContext);
  var userQueueIds = [];
  const [importCount, setImportCount] = useState(0)
  const [loading, setLoading] = useState(false);

  if (user.queues && user.queues.length > 0) {
    userQueueIds = user.queues.map((q) => q.id);
  }

  const GetTickets = (status, showAll, withUnreadMessages) => {
    const { count } = useTickets({
      status: status,
      showAll: showAll,
      withUnreadMessages: withUnreadMessages,
      queueIds: JSON.stringify(userQueueIds),
    });
    return count;
  };
  useEffect(() => {
	 const handleFilter = async () => {
    setLoading(true);
    try {
      setLoading(true);
      const { data } = await api.get(`file/list`);
      setImportCount(data.count);
      setLoading(false);
    } catch (err) {
      toastError(err);
    }
  };
    handleFilter();
  }, []);



  return (
    <div>
      <Container maxWidth="lg" className={classes.container}>
        <Grid container spacing={3}>
          <Grid item xs={4}>
            <Paper
              className={classes.customFixedHeightPaper}
              style={{ overflow: "hidden" }}
            >
              <Typography component="h3" variant="h6" color="primary" paragraph>
                {i18n.t("dashboard.messages.inAttendance.title")}
              </Typography>
              <Grid item>
                <Typography component="h1" variant="h4">
                  {GetTickets("open", "true", "false")}
                </Typography>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper
              className={classes.customFixedHeightPaper}
              style={{ overflow: "hidden" }}
            >
              <Typography component="h3" variant="h6" color="primary" paragraph>
                {i18n.t("dashboard.messages.waiting.title")}
              </Typography>
              <Grid item>
                <Typography component="h1" variant="h4">
                  {GetTickets("pending", "true", "false")}
                </Typography>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper
              className={classes.customFixedHeightPaper}
              style={{ overflow: "hidden" }}
            >
              <Typography component="h3" variant="h6" color="primary" paragraph>
                {i18n.t("dashboard.messages.closed.title")}
              </Typography>
              <Grid item>
                <Typography component="h1" variant="h4">
                  {GetTickets("closed", "true", "false")}
                </Typography>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper
              className={classes.customFixedHeightPaper}
              style={{ overflow: "hidden" }}
            >
              <Typography component="h3" variant="h6" color="primary" paragraph>
                {i18n.t("dashboard.messages.imported.title")}
              </Typography>
              <Grid item>
                <Typography component="h1" variant="h4">
                  {importCount}
                </Typography>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper
              className={classes.customFixedHeightPaper}
              style={{ overflow: "hidden" }}
            >
              <Typography component="h3" variant="h6" color="primary" paragraph>
                {i18n.t("dashboard.messages.sent.title")}
              </Typography>
              <Grid item>
                <Typography component="h1" variant="h4">
                  {GetTickets("sent", "true", "false")}
                </Typography>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper
              className={classes.customFixedHeightPaper}
              style={{ overflow: "hidden" }}
            >
              <Typography component="h3" variant="h6" color="primary" paragraph>
                {i18n.t("dashboard.messages.handedOut.title")}
              </Typography>
              <Grid item>
                <Typography component="h1" variant="h4">
                  {GetTickets("handed out", "true", "false")}
                </Typography>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper
              className={classes.customFixedHeightPaper}
              style={{ overflow: "hidden" }}
            >
              <Typography component="h3" variant="h6" color="primary" paragraph>
                {i18n.t("dashboard.messages.read.title")}
              </Typography>
              <Grid item>
                <Typography component="h1" variant="h4">
                  {GetTickets("read", "true", "false")}
                </Typography>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper className={classes.fixedHeightPaper}>
              <Chart />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default Dashboard;
