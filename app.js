const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const app = express();
let db = null;
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasTodoQuery = (requestQuery) => {
  return (
    requestQuery.todo !== undefined &&
    requestQuery.priority === undefined &&
    requestQuery.status === undefined
  );
};

const hasPriorityQuery = (requestQuery) => {
  return (
    requestQuery.priority !== undefined &&
    requestQuery.status === undefined &&
    requestQuery.todo === undefined
  );
};

const hasStatusQuery = (requestQuery) => {
  return requestQuery.priority === undefined && requestQuery.todo === undefined;
};

//GET method
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
         SELECT
         *
         FROM
           todo 
         WHERE
           todo LIKE '%${search_q}%'
           AND status = '${status}'
           AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
        SELECT
        *
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%'
          AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
        SELECT
        *
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%'
          AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
        SELECT
        *
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});
//Get a specific API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestQuery = `
        SELECT * FROM todo WHERE id = ${todoId};
    `;
  const resultQuery = await db.get(requestQuery);
  response.send(resultQuery);
});

//Post a todo API
app.post("/todos", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postQuery = `
        INSERT INTO todo(id, todo, priority, status)
        VALUES (${id}, '${todo}', '${priority}', '${status}');

    `;
  await db.run(postQuery);
  response.send("Todo Successfully Added");
});

//Update a todo API
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let getUpdateQuery = "";
  let result = "";
  switch (true) {
    case requestBody.status !== undefined:
      result = "Status";
      break;
    case requestBody.todo !== undefined:
      result = "Todo";
      break;
    case requestBody.priority !== undefined:
      result = "Priority";
      break;
  }
  getUpdateQuery = `
    SELECT * FROM todo WHERE id = ${todoId};
  `;

  const queryDetails = await db.get(getUpdateQuery);
  const {
    status = queryDetails.status,
    todo = queryDetails.todo,
    priority = queryDetails.priority,
  } = request.body;
  const updateQuery = `
    UPDATE todo SET todo = '${todo}',
    priority = '${priority}',
    status = '${status}'
    WHERE id = ${todoId};
  `;
  await db.run(updateQuery);
  response.send(`${result} Updated`);
});

//Delete a Todo API
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
        DELETE FROM todo WHERE id = ${todoId};
    `;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});
module.exports = app;
