const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

let database = null;
const databaseRoute = path.join(__dirname, "todoApplication.db");
const startServer = async () => {
  try {
    database = await open({
      filename: databaseRoute,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("The server is started at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Error:${e.message}`);
    process.exit(1);
  }
};
startServer();

//API 1
const checkCasePriority1 = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const checkCaseStatus2 = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const checkCaseStatusAndPriority3 = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

app.get("/todos/", async (request, response) => {
  let todosArray = null;
  const { search_q = "", priority, status } = request.query;
  let getResultTodoQuery = "";
  switch (true) {
    case checkCaseStatusAndPriority3(request.query):
      getResultTodoQuery = `
          SELECT * FROM todo 
          WHERE todo LIKE '%${search_q}%' 
            and status = '${status}'
            and priority = '${priority}';`;
      break;
    case checkCasePriority1(request.query):
      getResultTodoQuery = `
          SELECT * FROM todo 
          WHERE todo LIKE '%${search_q}%'
            and priority = '${priority}';`;
      break;
    case checkCaseStatus2(request.query):
      getResultTodoQuery = `
            SELECT * FROM todo 
            WHERE todo LIKE '%${search_q}%' 
                and status = '${status}';`;
      break;
    default:
      getResultTodoQuery = `SELECT * FROM todo 
            WHERE todo LIKE '%${search_q}%'`;
      break;
  }
  todosArray = await database.all(getResultTodoQuery);
  response.send(todosArray);
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getSpecTodo = `
        SELECT * FROM todo
        WHERE id = ${todoId};`;
  const todoItem = await database.get(getSpecTodo);
  response.send(todoItem);
});

//API 3
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const addTodoItemQuery = `
            INSERT INTO todo (id,todo,priority,status)\
            values(
                ${id},
                '${todo}',
                '${priority}',
                '${status}'
            ) `;
  const result = await database.run(addTodoItemQuery);
  response.send("Todo Successfully Added");
});

//API 4
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  let newColumn = "";
  const requestBody = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      newColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      newColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      newColumn = "Todo";
      break;
  }

  const todoGetQuery = `
        SELECT * FROM todo WHERE id = ${todoId}`;

  const existingTodo = await database.get(todoGetQuery);

  const {
    todo = existingTodo.todo,
    priority = existingTodo.priority,
    status = existingTodo.status,
  } = request.body;

  const putTodoItemQuery = `
            UPDATE todo 
            SET
                todo ='${todo}',
                priority = '${priority}',
                status ='${status}'
            WHERE id = ${todoId};`;

  await database.run(putTodoItemQuery);
  response.send(`${newColumn} Updated`);
});

//API 5
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoItem = `
            DELETE FROM todo where id=${todoId};`;
  await database.run(deleteTodoItem);
  response.send("Todo Deleted");
});

module.exports = app;
