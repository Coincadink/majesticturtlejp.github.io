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

// TODO - Find a way to do this with arrays and classes/id's to have multiple draggables.

// Fetch the draggable div and perform the dragElement function on it to give it dragging capabilities.

const dragable1 = document.getElementById("dragable1"),
dragzone1 = document.getElementById("dragzone1");
dragElement(dragable1, dragzone1);

const dragable2 = document.getElementById("dragable2"),
dragzone2 = document.getElementById("dragzone2");
dragElement(dragable2, dragzone2);
