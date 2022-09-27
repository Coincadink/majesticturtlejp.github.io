const dragElement = (element, dragzone) => 
{
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    // Activated on mouse release.

    const dragMouseUp = () => 
    {
        document.onmouseup = null;
        document.onmousemove = null;

        element.classList.remove("drag");
    };

    // Ran every frame that a div is being dragged.

    const dragMouseMove = (event) => 
    {
        event.preventDefault();

        pos1 = pos3 - event.clientX;
        pos2 = pos4 - event.clientY;
        pos3 = event.clientX;
        pos4 = event.clientY;

        element.style.top = `${element.offsetTop - pos2}px`;
        element.style.left = `${element.offsetLeft - pos1}px`;
    };

    // Activated when the dragzone is clicked.

    const dragMouseDown = (event) => 
    {
        event.preventDefault();

        pos3 = event.clientX;
        pos4 = event.clientY;

        // This can be used to add custom styling on drag.
        element.classList.add("drag");

        document.onmouseup = dragMouseUp;
        document.onmousemove = dragMouseMove;
    };

    dragzone.onmousedown = dragMouseDown;
};

// Fetch the draggable div and perform the dragElement function on it to give it dragging capabilities.

draggables = document.getElementsByClassName("draggable"),
dragzones = document.getElementsByClassName("dragzone");
for (let i = 0; i < draggables.length; i++) { dragElement(draggables[i], dragzones[i]); }

// Add a new randomized node when the spacebar is depressed.

let playground = document.getElementById("draggable-playground");

document.body.onkeydown = function(e) 
{
    if (e.code == "Backspace") 
    {
        playground.removeChild(playground.lastChild);
    }

    else if (e.code == "Space") 
    {
        // TODO - There simply has to be a cleaner solution to this?
        
        // Generate new node.
        var newNode = document.createElement('div');
        newNode.className = "draggable";
        newNode.innerHTML = '<header class="dragzone">\n<div class="wrapper">\n<div class="name">Portfolio</div>\n<div class="about">No... seriously man.</div>\n</div>\n</header>';
        
        // Inject the new node into the environment.
        playground.appendChild(newNode);

        // Enable the new node to be dragged.
        dragElement(newNode, newNode.firstChild);
    }
}