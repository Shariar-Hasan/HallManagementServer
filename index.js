const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { log } = require("console");
const { SharuDecryption, SharuEncryption } = require("./funtions");
const dummyProfile = require("./fakeData");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;
const moment = require("moment");

const port = process.env.PORT || 5500;

// const uri = "mongodb://localhost:27017/HMSDB";
const uri = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.ymyygov.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// use methods
app.use(cors());
app.use(bodyParser.json());

// all get methods
app.get("/", (req, res) => {
  res.send("Hello World!");
});
client.connect((err) => {
  //***************************************************
  // **************Notice Section**********************
  //************************User***************************
  const noticeCollection = client.db("HMSDB").collection("allNotices");
  const loginDataCollection = client.db("HMSDB").collection("loginData");
  const profileCollection = client.db("HMSDB").collection("profileData");
  const roomCollection = client.db("HMSDB").collection("roomData");
  const issueCollection = client.db("HMSDB").collection("issueData");
  const applicationCollection = client
    .db("HMSDB")
    .collection("applicationData");
  app.post("/addNotice", (req, res) => {
    const newNotice = req.body;
    noticeCollection.insertOne(newNotice).then((r) => res.send(r.acknowledged));
  });
  // getting all notice
  app.get("/notices", (req, res) => {
    noticeCollection
      .find({})
      .sort({ _id: -1 })
      .toArray((err, documents) => {
        res.send(documents);
      });
  });
  app.get("/getStickyNote", (req, res) => {
    noticeCollection
      .find({ stickyNews: true })
      .sort({ _id: -1 })
      .toArray((err, documents) => {
        res.send(documents[0]);
      });
  });
  app.get("/getCounterData", (req, res) => {
    const dataAsResponse = {
      numberOfRoom: 0,
      numberOfEmployee: 0,
      numberOfStudents: 0,
    };
    profileCollection.find({}).toArray((err, docs) => {
      dataAsResponse.numberOfEmployee = docs.filter(
        (u) => u.authentication.isEmployee === true
      ).length;
      dataAsResponse.numberOfStudents = docs.filter(
        (u) => u.authentication.isStudent === true
      ).length;
      roomCollection.find({}).toArray((err, docs) => {
        dataAsResponse.numberOfRoom = docs.length;
        res.send(dataAsResponse);
      });
    });
  });
  // getting a single notice
  app.get("/notice/:id", (req, res) => {
    noticeCollection
      .findOne({ _id: ObjectId(req.params.id.trim()) })
      .then((result) => {
        res.send(result);
      });
  });

  // deleting a single notice
  app.delete("/deleteNotice/:id", (req, res) => {
    noticeCollection
      .deleteOne({ _id: ObjectId(req.params.id.trim()) })
      .then((result) => {
        res.send(result.deletedCount > 0);
      });
  });

  //

  //

  //

  //

  //***************************************************
  //**************Create User Section******************
  //***************************************************
  app.post("/createUser", (req, res) => {
    loginDataCollection.insertMany(req.body).then((r) => {
      res.send(r.acknowledged);
    });
  });

  //

  //

  //
  //***************************************************
  //**************Login  Section***********************
  //***************************************************

  // app.post("/authentication", (req, res) => {
  //   loginDataCollection.findOne({ id: req.body.id }).then((result) => {
  //     if (result) {
  //       console.log(result.password, req.body.password);
  //       if (result.password === req.body.password) {
  //         res.send(result.authentication);
  //       } else {
  //         res.status(401).send();
  //       }
  //     } else {
  //       res.status(403).send();
  //     }
  //   });
  // });
  app.post("/authentication", (req, res) => {
    loginDataCollection.findOne({ id: req.body.id }).then((result) => {
      if (result && result.authentication) {
        const userAuthentication = result.authentication;

        if (result.password === req.body.password) {
          // res.send(result.authentication);

          profileCollection
            .findOne({ id: req.body.id })
            .then((prof) => {
              if (prof) {
                res.send(prof);
              } else {
                if (userAuthentication.isAdmin === false) {
                  let profile = dummyProfile.userProfile;
                  const { _id, ...rest } = profile;
                  profile = { ...rest };
                  profile.id = req.body.id;
                  profile.personalInfo.id = req.body.id;
                  profile.authentication = userAuthentication;
                  if (userAuthentication.isStudent) {
                    profile.hallDetails = [];
                    profile.notifications = [];
                  }
                  profileCollection
                    .insertOne(profile)
                    .then((r) => {
                      if (r.acknowledged) {
                        profileCollection
                          .findOne({ id: profile.id })
                          .then((userProfile) => {
                            res.send(userProfile);
                          })
                          .catch((err) => {
                            console.log(err);
                          });
                      }
                    })
                    .catch((err) => {
                      console.log(err);
                    });
                } else {
                  const profile = dummyProfile.adminProfile;
                  profile.id = req.body.id;
                  profile.personalInfo.email = req.body.id;
                  profile.personalInfo.avater = "";
                  profile.authentication = userAuthentication;
                  profileCollection.insertOne(profile).then((r) => {
                    if (r.acknowledged) {
                      profileCollection
                        .findOne({ id: profile.id })
                        .then((userProfile) => {
                          res.send(userProfile);
                        })
                        .catch((err) => {
                          console.log(err);
                        });
                    }
                  });
                }
              }
            })
            .catch((err) => {
              console.log(err);
            });
        } else {
          res.status(401).send();
        }
      } else {
        res.status(403).send(null);
      }
    });
  });

  app.patch("/changepass", (req, res) => {
    loginDataCollection
      .updateOne(
        { id: req.body.id },
        {
          $set: {
            password: req.body.password,
          },
        }
      )
      .then((result) => {
        res.send(result.modifiedCount > 0);
      });
  });
  //

  //

  //
  //***************************************************
  //**************Profile  Section*********************
  //***************************************************
  
  app.patch("/updateprofile/:id", (req, res) => {
    const {
      id,
      name,
      avater,
      birthDate,
      fatherName,
      motherName,
      address,
      city,
      division,
      zip,
      phoneNo,
      email,
      course,
      department,
      session,
    } = req.body;

    profileCollection
      .updateOne(
        { _id: ObjectId(req.params.id.trim()) },
        {
          $set: {
            personalInfo: {
              id,
              name,
              avater,
              birthDate,
              fatherName,
              motherName,
            },
            contact: { address, city, zip, division, phoneNo, email },
            institutional: { department, course, session },
          },
        }
      )
      .then((result) => {
        res.send(result.modifiedCount > 0);
      });
  });
  app.get("/getprofile/:id", (req, res) => {
    profileCollection.findOne({ id: req.params.id.trim() }).then((result) => {
      res.send(result);
    });
  });

  //

  //
  //***************************************************
  //**************User data  Section*******************
  //***************************************************

  app.get("/userCountData", (req, res) => {
    // const data = {}
    profileCollection.find({}).toArray((err, docs) => {
      const totaluser = docs.length;
      const stduser = docs.filter(
        (acc) => acc.authentication.isStudent === true
      ).length;
      const empluser = docs.filter(
        (acc) => acc.authentication.isEmployee === true
      ).length;
      const admuser = docs.filter(
        (acc) => acc.authentication.isAdmin === true
      ).length;
      const allotedstd = docs.filter(
        (acc) => acc.hallDetails?.length > 0
      ).length;
      res.send({ totaluser, admuser, stduser, empluser, allotedstd });
    });
  });
  //
  //***************************************************
  //**************All Profile  Section*****************
  //***************************************************

  app.get("/allprofile", (req, res) => {
    profileCollection.find({}).toArray((err, docs) => {
      res.send(docs);
    });
  });
  app.delete("/deleteUser/:id", (req, res) => {
    profileCollection.deleteOne({ id: req.params.id }).then((result) => {
      if (result.deletedCount > 0) {
        loginDataCollection
          .deleteOne({ id: req.params.id })
          .then((loginDataDeleteResult) => {
            res.send(loginDataDeleteResult.deletedCount > 0);
          });
      }
    });
  });
  app.patch("/updateUserProfile/:oid", (req, res) => {
    const {
      id,
      name,
      avater,
      birthDate,
      fatherName,
      motherName,
      address,
      city,
      division,
      zip,
      phoneNo,
      email,
      course,
      department,
      session,
    } = req.body;

    profileCollection
      .updateOne(
        { _id: ObjectId(req.params.oid.trim()) },
        {
          $set: {
            personalInfo: {
              id,
              name,
              avater,
              birthDate,
              fatherName,
              motherName,
            },
            contact: { address, city, zip, division, phoneNo, email, zip },
            institutional: { department, course, session },
          },
        }
      )
      .then((result) => {
        res.send(result.modifiedCount > 0);
      });
  });

  //
  //
  //
  //
  //
  //***************************************************
  //**************Application  Section*****************
  //***************************************************

  app.post("/applyseat", (req, res) => {
    const application = req.body;
    applicationCollection.insertOne(application).then((result) => {
      res.send(result);
    });
  });
  app.get("/appliedornot/:id", (req, res) => {
    applicationCollection.findOne({ id: req.params.id }).then((result) => {
      if (result) {
        res.send(true);
      } else {
        res.send(false);
      }
    });
  });
  app.patch("/leavehall/:id", (req, res) => {
    let leaveHallDetails = req.body;
    profileCollection
      .updateOne(
        {
          id: req.params.id,
          "hallDetails.allotedDate": leaveHallDetails?.allotedDate,
          "hallDetails.cardExpiryDate": leaveHallDetails?.cardExpiryDate,
        },
        {
          $set: {
            "hallDetails.$.cardExpiryDate": moment().format("YYYY-MM-DD"),
          },
        }
      )
      .then((result) => {
        if (result.modifiedCount > 0) {
          roomCollection.updateOne(
            { roomNo: leaveHallDetails.roomNo },
            {
              $pull: {
                allotedUsers: req.params.id,
              },
            }
          );
        }
      });
  });
  app.get("/getapplications", (req, res) => {
    applicationCollection.find({}).toArray((err, docs) => {
      res.send(docs);
    });
  });
  app.delete("/deleteApplication/:id", (req, res) => {
    applicationCollection.deleteOne({ id: req.params.id }).then((result) => {
      res.send(result.deletedCount > 0);
    });
  });
  app.get("/roomCheck", (req, res) => {
    roomCollection.find({}).toArray((err, docs) => {
      // const freeRoomList = docs.filter((room) => room.allotedUsers.length < 4);
      const freeRoomList = docs;
      res.send(freeRoomList);
    });
  });
  app.post("/appointSeat", (req, res) => {
    const { stdId, roomNo, allotedDate } = req.body;

    const newHallDetails = {
      allotedDate: allotedDate,
      cardExpiryDate: moment(allotedDate).add(1, "year").format("YYYY-MM-DD"),
      roomNo: roomNo,
    };
    profileCollection.findOne({ id: stdId }).then((stdProfile) => {
      const hallDetailsLength = stdProfile.hallDetails.length;

      if (
        hallDetailsLength === 0 ||
        (hallDetailsLength > 0 &&
          moment(
            stdProfile.hallDetails[hallDetailsLength - 1].cardExpiryDate
          ).isBefore(new Date()))
      ) {
        roomCollection
          .updateOne(
            { roomNo: roomNo },
            {
              $push: {
                allotedUsers: stdId,
              },
            }
          )
          .then((result) => {
            profileCollection
              .updateOne(
                { id: stdId },
                {
                  $push: {
                    hallDetails: newHallDetails,
                  },
                }
              )
              .then((result) => {
                res.send(true);
              });
          })
          .catch((err) => {
            res.send(false);
          });

        applicationCollection.deleteOne({ id: stdId });
      } else {
        res.send(false);
      }
    });
  });
  //***************************************************
  //**************Issue  Section*****************
  //***************************************************

  app.post("/addIssue", (req, res) => {
    const issue = req.body;
    issueCollection.insertOne(issue).then((result) => {
      res.send(result);
    });
  });
  app.get("/getIssue/:id", (req, res) => {
    issueCollection
      .find({ id: req.params.id })
      .sort({ _id: -1 })
      .toArray((err, docs) => {
        res.send(docs);
      });
  });
  app.get("/getAllIssue", (req, res) => {
    issueCollection
      .find({})
      .sort({ _id: -1 })
      .toArray((err, docs) => {
        res.send(docs);
      });
  });
  app.patch("/updateIssueStatus", (req, res) => {
    const { _id, runningStatus } = req.body;
    issueCollection
      .updateOne(
        { _id: ObjectId(_id) },
        {
          $set: {
            status: runningStatus,
          },
        }
      )
      .then((result) => {
        res.send(result.modifiedCount > 0);
      });
  });
  const checkExpiration = () => {
    const hallExpiryNotification = {};
    profileCollection.find({}).toArray((err, profiles) => {
      profiles.forEach((profile) => {
        const lastAlloted = profile.hallDetails.length - 1;
        if (
          moment(profile.hallDetails[lastAlloted].cardExpiryDate).isBefore(
            new Date()
          )
        ) {
          const lastAllotedRoom = profile.hallDetails[lastAlloted].roomNo;

          roomCollection
            .findOne({ roomNo: lastAllotedRoom })
            .then((roomInfo) => {
              const newRoomMembers = roomInfo.allotedUsers.filter(
                (member) => member !== profile.id
              );
              roomCollection.updateOne(
                { roomNo: lastAllotedRoom },
                {
                  $set: {
                    allotedUsers: newRoomMembers,
                  },
                }
              );
            });
        }
      });
    });
  };
  app.use((err, req, res, next) => {
    if (err.message) {
      res.status(500).send({ success: false, msg: err.message });
    } else {
      res.status(500).send({ success: false, msg: "Something went wrong" });
    }
  });
});
//

//

//

//

//
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
