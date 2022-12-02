const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");
let server, agent;


function extractCsrf(response) {
  var $ = cheerio.load(response.text);
  return $("[name=_csrf]").val();
}

describe("Testing Todo ", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => {});
    agent = request.agent(server);
  });
  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  test("To Create new todo...", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCsrf(res);
    const response = await agent.post("/todos").send({
      title: "Complete Assignments",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(422);
  });



  test("To update the completed field of a given todo list : ", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCsrf(res);
    await agent.post("/todos").send({
      title: "Study for exams",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });


    const todoID = await agent.get("/todos").then((response) => {
      const parsedResponse1 = JSON.parse(response.text);
      return parsedResponse1[1]["id"];
    });


    const setCompletionResponse1 = await agent
      .put(`/todos/${todoID}`)
      .send({ completed: true, _csrf: csrfToken });
    const parsedUpdateResponse3 = JSON.parse(setCompletionResponse1.text);
    expect(parsedUpdateResponse3.completed).toBe(true);


    const setCompletionResponse2 = await agent
      .put(`/todos/${todoID}`)
      .send({ completed: false, _csrf: csrfToken });
    const parsedUpdateResponse2 = JSON.parse(setCompletionResponse2.text);
    expect(parsedUpdateResponse2.completed).toBe(false);
  });
  


  test("Marking a todo as complete", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrf(res);
    await agent.post("/todos").send({
      title: "Do the home work",
      dueDate: new Date().toLocaleString("en-CA"),
      completed: false,
      _csrf: csrfToken,
    });

    const gropuedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(gropuedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];


    res = await agent.get("/");
    csrfToken = extractCsrf(res);
    console.log(latestTodo)
    const markAsCompleteresponse = await agent.put(`todos/${latestTodo["id"]}`).send({
      _csrf: csrfToken,

    });
    const parsedUpdateResponse = JSON.parse(markAsCompleteresponse.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });


  test("Marks a todo with the given ID as incomplete", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrf(res);
    await agent.post("/todos").send({
      title: "Testing Incomplete",
      dueDate: new Date().toISOString(),
      completed: true,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponsee = JSON.parse(groupedTodosResponse.text);
    const completedItemsCount = parsedGroupedResponsee.completedItems.length;
    const latestTodoo = parsedGroupedResponsee.completedItems[completedItemsCount - 1];
    const completed = !latestTodoo.completed;
    res = await agent.get("/");
    csrfToken = extractCsrf(res);

    const markCompleteResponses = await agent
      .put(`/todos/${latestTodoo.id}`)
      .send({
        _csrf: csrfToken,
        completed: completed,
      });

    const parsedUpdateResponses = JSON.parse(markCompleteResponses.text);
    expect(parsedUpdateResponses.completed).toBe(false);
  });

 
  //Test
  test("Delete todo using ID", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrf(res);
    await agent.post("/todos").send({
      title: "Done with the exams",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const gropuedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(gropuedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/");
    csrfToken = extractCsrf(res);

    const response = await agent.put(`todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
    });
    const parsedUpdateResponse = JSON.parse(response.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });


  
});
