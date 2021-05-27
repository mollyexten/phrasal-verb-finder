// Global variables
const main = document.querySelector("main")
// Arrays for storing saved recipe information from local storage
const favoriteRecipes = []
const searchIngredients = []

// Display random image with link to recipe on home page
loadHome()

// Event listeners for nav bar icons and header
const home = document.querySelector("#nav-home")
home.addEventListener("click", loadHome)
const saved = document.querySelector("#nav-save")
saved.addEventListener("click", function () {
  viewRecipeBox(favoriteRecipes, searchIngredients)
})
const mainHeader = document.querySelector(".header-h1")
mainHeader.addEventListener("click", loadHome)

// Event listener for the search bar
const form = document.querySelector("form")
form.addEventListener("submit", (e) => {
  e.preventDefault()
  let searchValue = document.querySelector("#search-value").value
  showResults(searchValue)
  document.querySelector("#search-value").value = ""
})

// Load a random recipe image in the "home page"
async function loadHome() {
  removeMain()
  main.removeAttribute("id")
  const randomURL = "https://www.themealdb.com/api/json/v1/1/random.php"
  try {
    let response = await axios.get(randomURL)
    let randomRecipe = response.data.meals[0]
    const mainImage = createMainImage(randomRecipe)
    mainImage.addEventListener("click", (e) => {
      renderRecipe(e.target.id, randomRecipe.strIngredient1)
      window.localStorage.setItem("randomRecipe", e.target.id)
    })
    main.append(mainImage)
    appendFooter()
    return response
  } catch (err) {
    console.error(err)
  }
}

// Remove all appended child elements in the main part
function removeMain() {
  while (main.lastChild) {
    main.removeChild(main.lastChild)
  }
}

// Add a footer citing the API
function appendFooter() {
  let footer = `<footer>Recipes sourced from <a href="https://www.themealdb.com">TheMealDB</a> (API)</footer>`
  return main.insertAdjacentHTML("beforeend", footer)
}

// Display search results based on ingredient
async function showResults(ingredient) {

  // Store the URL that accesses the API in a variable
  const ingredientURL = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`
  
  // Make the try/catch part
  try {
    
    // If invoking showResults from within the renderRecipe function, the "recipe-view" id will need to be removed from main
    main.removeAttribute("id");

    // Invoke the removeMain() function to clear any existing search results and recipe
    removeMain()
    
    // Access the API
    let response = await axios.get(ingredientURL)
    
    // Store the meal data array in a variable
    let recipes = response.data.meals

    // Catch recipes that have a null value and indicate that it yielded no results
    if (recipes === null) {
      const noRecipes = showNoRecipes(ingredient)
      main.append(noRecipes)
      return
    }

    // Report the number of results found
    if (recipes.length > 0) {
      const recipeCount = countRecipes(recipes, ingredient)
      main.append(recipeCount)
    }

    // Loop through each meal data item, storing image and dish name in variables
    recipes.forEach((recipe) => {
      
      // Create a container for each image and dish
      const listRecipeDiv = document.createElement("div")
      listRecipeDiv.className = "list-recipe-div"
      main.append(listRecipeDiv)
      
      // Create html elements for each image and dish with attributes
      const image = createListImage(recipe)
      const dish = createListDish(recipe)
      listRecipeDiv.addEventListener("click", (e) => {
        renderRecipe(e.target.id, ingredient)
      })
      
      // Create a container for image and dish, append to DOM
      listRecipeDiv.append(image)
      listRecipeDiv.append(dish)
    })
    appendFooter()
    return response
  } catch (err) {
    console.error(err)
  }
}

// Display the photo, ingredients, and instructions for a specific recipe
async function renderRecipe(id, ingredient) {
  removeMain()
  
  // Store the URL that accesses the API in a variable
  const recipeURL = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`
  
  try {

    // Access the API
    let response = await axios.get(recipeURL)
    let recipe = response.data.meals[0]

    // Assign id to main to allow recipe formatting
    main.id = "recipe-view"

    // Create recipe name element and append to main
    const name = createRecipeHeader(recipe)
    main.append(name)

    // Create a div to store image and ingredients
    const recipeDiv = document.createElement("div")
    recipeDiv.className = "recipe-div"
    const image = createRecipeImage(recipe)
    main.append(recipeDiv)
    recipeDiv.append(image)

    // Append ingredients within this function
    listIngredients(recipe)

    // Create a div for the instructions
    const instructionsDiv = document.createElement("div")
    instructionsDiv.className = "instructions-div"
    main.append(instructionsDiv)

    // Create instructions header and paragraph and append
    const instructionsHeader = createInstructionsHeader()
    const instructions = createInstructions(recipe)
    instructionsDiv.append(instructionsHeader)
    instructionsDiv.append(instructions)
    
    // Create a recipe button div and prepend to the main part
    const recipeButtonDiv = document.createElement("div")
    recipeButtonDiv.className = "recipe-button-div"
    main.prepend(recipeButtonDiv)

    // Append back/explore button
    const backExplore = document.createElement("button")
    backExplore.id = "back-explore-button"
    let randomFlag = window.localStorage.getItem("randomRecipe")
    let exploreFlag = window.localStorage.getItem("exploreRecipe")
    if (favoriteRecipes.includes(id) || randomFlag === id || exploreFlag === id) {  
      backExplore.textContent = "Explore more"
      backExplore.addEventListener("click", function () {
        exploreMore(recipe.strCategory)
      })
    } else {
      backExplore.textContent = "Back to results"
      backExplore.addEventListener("click", function () {
        showResults(ingredient)
      })
    }
    recipeButtonDiv.append(backExplore)

    // Append the save button to the recipeButtonDiv
    const save = createSaveButton(favoriteRecipes, id)
    recipeButtonDiv.append(save)
    save.addEventListener("click", (e) => {
      e.target.id = id
      saveRecipe(e.target.id, ingredient)
    })

    return response
  } catch (err) {
    console.error(err)
  }
}

function listIngredients(obj) {
  
  // Create elements for ingredients table and append after image
  recipeDiv = document.querySelector(".recipe-div")
  ingredientsDiv = document.createElement("div")
  ingredientsDiv.className = "ingredients-div"
  recipeDiv.append(ingredientsDiv)

  const ingredientHeader = createIngredientHeader()
  ingredientsDiv.append(ingredientHeader)
  
  ingredientTable = document.createElement("table")
  ingredientsDiv.append(ingredientTable)
  
  // Set up arrays for measurements and ingredients to push into later
  let measurements = []
  let ingredients = []
  
  // I used this resource to understand for...in loops: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in
  for (let key in obj) {
    // This reference showed me how to check if a string contains a substring: https://flaviocopes.com/how-to-string-contains-substring-javascript/
    if (key.includes("strMeasure") && (obj[key] != " " || obj[key] != "")) {
      measurements.push(obj[key])
    }
  }
  for (let key in obj) {
    if (key.includes("strIngredient") && (obj[key] != "" || obj[key] != " ")) {
      ingredients.push(obj[key])
    }
  }

  // Fill in the table with measurement and ingredient arrays
  for (let i = 0; i < measurements.length; i++) {
    let row = ingredientTable.insertRow(i)
    let cell1 = row.insertCell(0)
    let cell2 = row.insertCell(1)
    cell1.textContent = measurements[i]
    cell2.textContent = ingredients[i]
  }
}

// Keep track of saved recipes
function saveRecipe(id, searchIngredient) {
  // Check for duplicate recipes
  if (favoriteRecipes.includes(id)) {
    viewRecipeBox(favoriteRecipes, searchIngredients)
  } else {
    window.localStorage.setItem(id, id)
    favoriteRecipes.push(window.localStorage.getItem(id))
    searchIngredients.push(searchIngredient)
    viewRecipeBox(favoriteRecipes, searchIngredients)
  }
}

async function exploreMore(category) {
  removeMain()
  main.removeAttribute("id")
  const recipeCategory = displayRecipeCategory(category)
  main.append(recipeCategory)

  const exploreURL = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`

  try {
    let response = await axios.get(exploreURL)
    let recipeList = response.data.meals
    shuffle(recipeList)
    let recipes = recipeList.slice(0, 12)
    recipes.forEach((recipe) => {
      const listRecipeDiv = document.createElement("div")
      listRecipeDiv.className = "list-recipe-div"
      main.append(listRecipeDiv)
    
    // Create html elements for each image and dish with attributes
      const image = createListImage(recipe)
      const dish = createListDish(recipe)
      ingredient = recipe.strIngredient1
      listRecipeDiv.addEventListener("click", (e) => {
        renderRecipe(e.target.id, ingredient)
        window.localStorage.setItem("exploreRecipe", e.target.id)
      })
    
    // Create a container for image and dish, append to DOM
    listRecipeDiv.append(image)
    listRecipeDiv.append(dish)
  })
  appendFooter()
    return response
  } catch (err) {
    console.error(err)
  }
}

function shuffle(recipes) {
  let shuffledRecipes = recipes
  let currentIndex = recipes.length
  let temporaryValue
  let randomIndex
  while (currentIndex > 0) {
    randomIndex = Math.round(Math.random() * currentIndex)
    currentIndex--
    temporaryValue = shuffledRecipes[currentIndex]
    shuffledRecipes[currentIndex] = shuffledRecipes[randomIndex]
    shuffledRecipes[randomIndex] = temporaryValue
  }
  return shuffledRecipes;
}

async function viewRecipeBox(recipes, ingredients) {
  removeMain()
  main.removeAttribute("id");

  // Create an array for recipe URLs
  let recipeURLs = []
  for (let i = 0; i < recipes.length; i++) {
    recipeURLs.push(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipes[i]}`)
  }
  try {
    let recipeIDs = []
    for (let i = 0; i < recipeURLs.length; i++) {
      let response = await axios.get(recipeURLs[i])
      let recipe = response.data.meals[0]
      
      // Create a div for each recipe and store image and name
      const listRecipeDiv = document.createElement("div")
      listRecipeDiv.className = "list-recipe-div"
      main.append(listRecipeDiv)

      const image = createListImage(recipe)
      listRecipeDiv.append(image)

      const dish = createListDish(recipe)
      listRecipeDiv.append(dish)
      listRecipeDiv.addEventListener("click", (e) => {
        renderRecipe(e.target.id, ingredients[i])
      })
      
      recipeIDs.push(image.id)
    }
    
    // Indicate how many recipes are saved at the top of main
    const savedRecipesHeader = createSavedHeader(recipes)
    main.prepend(savedRecipesHeader)
    
    return recipeURLs
  } catch (err) {
    console.error(err)
  }
}
