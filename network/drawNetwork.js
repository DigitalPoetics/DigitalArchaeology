//get the json files (or use the arrays at the bottom)

// d3.queue()
// 	.defer(d3.json, "https://raw.githubusercontent.com/diagrammaticreadings/Sing-Page-Web/main/Network/nfnodes.json")
// 	.defer(d3.json, "https://raw.githubusercontent.com/diagrammaticreadings/Sing-Page-Web/main/Network/nflink.json")
// 	.await(function(error, nodes_data, links_data) {
// 	if (error) throw error;
// 	console.log(nodes_data);
// 	console.log(links_data);

// let searchLabel = formData['node'].toLowerCase();
// console.log('final', searchLabel)

async function getData() {
  let nodes_data;
  let links_data;
  try {
    // const linksProm = axios.get(
    //   "https://raw.githubusercontent.com/diagrammaticreadings/Sing-Page-Web/main/Network/nflink.json"
    // );
    const linksProm = axios.get("links.json");
    // const nodesProm = axios.get(
    //   "https://raw.githubusercontent.com/diagrammaticreadings/Sing-Page-Web/main/Network/nfnodes.json"
    // );
    const nodesProm = axios.get("nodes.json");
    const results = await Promise.all([linksProm, nodesProm]);
    // console.log(results)
    links_data = results[0].data;
    nodes_data = results[1].data;
    // console.log(links_data);
    // console.log(nodes_data);
    // printData(results);
  } catch (err) {
    console.log(err);
  }
  //   console.log(nodes_data);
  // console.log(nodes_data.length);
  //   console.dir(nodes_data);
  // for (let i = 0; i<nodes_data.length; i++){
  // 	console.log(nodes_data[i].name)
  // }

  //Width and height
  var w = (10000 * innerWidth) / 10000;
  var h = (10000 * innerHeight) / 10000;
  var border = 1;
  var bordercolor = "black";

  //create somewhere to put the force directed graph
  var svg = d3
    .select("#network")
    .append("svg")
    .attr("id", "networkSvg")
    .attr("width", w)
    .attr("height", h)
    // .attr("viewBox", `0 0 ${w} ${h}`)
    // .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("border", border);

  //border
  var borderPath = svg
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("height", h)
    .attr("width", w)
    .style("stroke", bordercolor)
    .style("fill", "white")
    .style("stroke-width", border);

  var radius = 5;

  //set up the simulation and add forces
  var simulation = d3.forceSimulation().alpha(1).nodes(nodes_data);

  var link_force = d3
    .forceLink(links_data)
    .id(function (d) {
      return d.name;
    })
    .distance(50);

  var charge_force = d3
    .forceManyBody()
    .strength(-150)
    .theta(0.5)
    .distanceMax(400);
  var center_force = d3.forceCenter(w / 2, h / 2); //width "w" and height "h"

  var collision_force = d3
    .forceCollide()
    .strength(0.8)
    .radius(5)
    .iterations(10);

  simulation
    .force("charge", charge_force)
    .force("center", center_force)
    .force("collision", collision_force)
    .force("link", link_force);

  //add tick instructions:
  simulation.on("tick", tickActions);

  //degree
  links_data.forEach(function (link) {
    if (!link.source["linkCount"]) link.source["linkCount"] = 0;
    if (!link.target["linkCount"]) link.target["linkCount"] = 0;

    link.source["linkCount"]++;
    link.target["linkCount"]++;
  });

  //Select neighbor property
  //Toggle stores whether the highlighting is on

  //Create an array logging what is connected to what
  var linkedByIndex = {};
  for (i = 0; i < nodes_data.length; i++) {
    linkedByIndex[i + "," + i] = 1;
  }
  //   console.log(linkedByIndex);
  links_data.forEach(function (d) {
    linkedByIndex[d.source.index + "," + d.target.index] = 1;
    // console.log(d.source.index);
  });
  //   console.log(linkedByIndex);

  //This function looks up whether a pair are neighbours
  function neighboring(a, b) {
    return linkedByIndex[a.index + "," + b.index];
  }
  //   console.log("linkedByIndex", linkedByIndex);

  let toggle = 0;

  function connectedNodes() {
    if (toggle == 0) {
      //   console.log(this);
      //   console.dir(this);

      //Reduce the opacity of all but the neighbouring nodes
      d = d3.select(this).node().__data__;
      node.style("opacity", function (o) {
        // console.log(o);
        // console.log(o);
        // console.log(d);
        return neighboring(d, o) || neighboring(o, d) ? 1 : 0.3;
      });
      link.style("opacity", function (o) {
        return (d.index == o.source.index) | (d.index == o.target.index)
          ? 1
          : 0.3;
        // add
      });
      //Reduce the op
      toggle = 1;
    } else {
      //Put them back to opacity=1
      node.style("opacity", 1);
      link.style("opacity", 1);
      toggle = 0;
    }
  }

  //add zoom capabilities
  var zoom_handler = d3.zoom().on("zoom", zoom_actions);

  zoom_handler(svg);

  svg.on("dblclick.zoom", null);

  //add encompassing group for the zoom
  var g = svg.append("g").attr("class", "everything");

  //draw lines for the links
  var link = g
    .append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links_data)
    .enter()
    .append("line")
    .attr("stroke-width", 0.1)
    .style("stroke-opacity", 1)
    .style("stroke", "#a6a6a6"); //linkcolor

  //draw circles for the nodes
  var node = g
    .append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(nodes_data)
    .enter()
    .append("circle")
    .attr("id", (d) => d.name)
    // .attr("class", "clicked")
    .attr("r", nodeSize)
    // .style("stroke", "white")
    // .style("stroke-width", 3)
    // .style("stroke-opacity", 0.5)
    .style("fill-opacity", 1)
    .style("transform", translate)
    // .on("click", connectedNodes)
    // .on("click", connectedNodes)
    .style("fill", circleColour); //circlecolor

  //   console.log(node);
  function translate(d) {
    // get the center of svg
    const svgElem = document.querySelector("#network svg");
    const rectSize = svgElem.getBoundingClientRect();
    const centerX = Math.floor((rectSize.width / 2) * 10000) / 10000;

    const centerY = Math.floor((rectSize.height / 2) * 10000) / 10000;

    // clockwise
    // if (d.x > centerX) {
    //   d.x = centerX;
    // }
    // if (d.x < centerX) {
    //   d.x = centerX;
    // }
    // if ((d.x = centerX)) {
    //   if (d.y > centerY) {
    //     d.x = d.x - (d.y - centerY);
    //   }
    //   if (d.y < centerY) {
    //     d.x = d.x + (centerY - d.y);
    //   }
    // }
    // // change y coordinates
    // if (d.y > centerY) {
    //   //   d.y = centerY - d.y;
    //   d.y = centerY;
    // }
    // if (d.y < centerY) {
    //   d.y = centerY;
    // }
    // if ((dy = centerY)) {
    //   if (d.x > centerX) {
    //     d.y = d.y - (d.x - centerX);
    //   }
    //   if (d.x < centerX) {
    //     d.y = d.y + (centerX - d.x);
    //   }
    // }

    // change x coordinates 90 deegree counter-clockwise
    if (d.x > centerX) {
      d.x = d.x - centerX;
    }
    if (d.x < centerX) {
      d.x = centerX - d.x;
    }
    if ((d.x = centerX)) {
      if (d.y > centerY) {
        d.x = d.x + (d.y - centerY);
      }
      if (d.y < centerY) {
        d.x = d.x - (centerY - d.y);
      }
    }
    // change y coordinates
    if (d.y > centerY) {
      //   d.y = centerY - d.y;
      d.y = d.y - centerY;
    }
    if (d.y < centerY) {
      d.y = centerY - d.y;
    }
    if ((dy = centerY)) {
      if (d.x > centerX) {
        d.y = d.y + (d.x - centerX);
      }
      if (d.x < centerX) {
        d.y = d.y - (centerX - d.x);
      }
    }
  }

  // color the circle on click

  // select all nodes
  let selectedCircles = document.querySelectorAll("circle");
  // add click event
  selectedCircles.forEach((item, index, array) => {
    item.addEventListener("click", (e) => {
      // function to add class to the neighbor nodes
      connectedNodes1(e.target);
      //   console.log(e.target);
      //   checkboxBtn(e.target)
      //   console.log(e.target.id);
      checkbox(e.target.id);
    });
  });

  function checkbox(node) {
    // console.log(node);
    // const checkBtn = d3.selectAll("input[type='checkbox']");
    const checkBtn = document.querySelectorAll("input[type='checkbox']");
    // console.log(checkBtn);
    // console.log(checkBtn.parentElement);
    // console.dir(checkBtn);
    // checkBtn.each(function (d, i) {
    //   console.log(d.__on);
    // });
    checkBtn.forEach((item, index, array) => {
      //   console.log(item);
      //   console.dir(item);
      console.log(item.checked);

      if (item.parentElement.id == node) {
        console.log(item.parentElement.id);
        console.log(item.checked);
        if (item.checked != true) {
          item.checked = true;
        } else {
          item.checked = false;
        }
      } else {
        return;
      }
    });
  }

  // add the id of the clicked node as class of the neighbor nodes
  function connectedNodes1(n) {
    // data of the node
    d = d3.select(n).node().__data__;

    // id of the node
    let className = n.__data__.index;
    // on click assign id of the node as class of neighbor nodes
    if (n.getAttribute("class") != d.index) {
      node.classed(className, function (o) {
        if (neighboring(d, o) | neighboring(o, d)) {
          return true;
        } else {
          return false;
        }
      });
      link.classed(className, function (o) {
        if (neighboring(d, o) | neighboring(o, d)) {
          return true;
        } else {
          return false;
        }
      });
      // color the nodes that have class
      //   onClick();
    } else {
      // on unclick remove the node id from class of neighbors
      let nodeUnclicked = document.querySelectorAll("circle");
      nodeUnclicked.forEach((item) => {
        item.classList.remove(`${className}`);
      });
      let linkUnclicked = document.querySelectorAll("line");
      linkUnclicked.forEach((item) => {
        item.classList.remove(`${className}`);
      });
      // remove color from the nodes with removed class
      //   onClick();
    }
    onClick();
  }
  // color the nodes based on class
  function onClick() {
    let clickedCircles = document.querySelectorAll("circle");
    clickedCircles.forEach((item) => {
      // if the node has class, color red
      if (item.getAttribute("class")) {
        return d3.select(item).style("fill", "#ff0000");
        // console.log(item);
      } else {
        // if the node does not have any class
        d3.select(item).style("fill", (d) => {
          //   console.log(item);
          if (d.type == "member") {
            return "#ff8c69";
          } else {
            return "#8aded8";
          }
          //   if (d.group == "Audio Archives") {
          //     return "#ffe135";
          //   }
          //   if (d.group == "Avant-garde") {
          //     return "#ff8c69";
          //   }
          //   if (d.group == "The Black Arts Movement") {
          //     return "#f6adc6";
          //   }
          //   if (d.group == "Emergent Poets") {
          //     return "#bcee68";
          //   }
          //   if (d.group == "The Feminist Poetry Movement") {
          //     return "#00bfff";
          //   }
          //   if (d.group == "New Formalism") {
          //     return "#6f00ff";
          //   }
          //   if (d.group == "Teaching/Survey") {
          //     return "#ff3e96";
          //   }
          //   {
          //     return "#8aded8";
          //   }
        });
      }
    });
    let clickedLinks = document.querySelectorAll("links");
    clickedLinks.forEach((item) => {
      // if the node has class, color red
      if (item.getAttribute("class")) {
        return d3.select(item).style("stroke", "#ff0000");
        // console.log(item);
      } else {
        // if the node does not have any class
        return d3.select(item).style("stroke", "black");
      }
    });
  }

  //   function onUnClick(){
  // 	let clickedCircles = document.querySelectorAll('circle')
  // 	clickedCircles.forEach((item)=>{
  // 		if(item.getAttribute("class"){

  // 		})
  // 	})
  //   }

  //   clickedCircles.style.fill = "red";

  // function get group name
  let groups = [];

  nodes_data.forEach((item) => {
    if (item.group != "poet") {
      groups.push(item.group);
    } else {
      return;
    }
  });

  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }

  let uniqueGroup = groups.filter(onlyUnique);
  console.log(uniqueGroup);

  // create group labels
  let container = document.querySelector(".container-labels");

  uniqueGroup.forEach((item, index, array) => {
    // console.dir(item);
    // console.log(item);
    let categoryDiv = document.createElement("div");
    categoryDiv.setAttribute("id", `${item}`);
    categoryDiv.classList.add("dropdown-item", "group-label");
    categoryDiv.innerHTML = `<p>${item}</p>`;
    container.appendChild(categoryDiv);
  });

  let containerDiv = d3
    .selectAll(".group-label")
    .data(nodes_data)
    .enter()
    .each((d, i) => {
      if (d.group == "poet") {
        return;
      } else {
        console.log(d.group);
        createCheckbox(d);
      }
    });

  console.dir(containerDiv);
  // create checkbox
  function createCheckbox(d) {
    let container = document.querySelectorAll(".group-label");
    // for (let i = 0; i < container.length; i++) {
    container.forEach((item) => {
      //   console.log(item);
      //   console.log(item.textContent);
      if (d.group == item.id) {
        let option = document.createElement("label");
        option.classList.add("checkbox", "dropdown-item");
        option.setAttribute("id", `${d.name}`);
        option.innerHTML = `<input type="checkbox">${d.name}`;
        item.appendChild(option);
      } else {
        return;
      }
    });
  }

  // check button input
  const checkboxBtn = document.querySelectorAll("input[type='checkbox']");
  const checkBtn = d3.selectAll("input[type='checkbox']");
  checkBtn.on("click", onNodeCheck);

  //   on node check
  function onNodeCheck() {
    // let nodeId = [];
    // console.log("yup");
    // console.log(this);
    nodeId = this.parentElement.id;
    // console.log(nodeId);
    // console.log(nodeId);
    // console.log("original", this.checked);
    let selectedNodes = document.querySelectorAll("circle");
    if (!this.checked) {
      selectedNodes.forEach((item, index) => {
        if (item.__data__.name == nodeId) {
          connectedNodes1(item);
        } else {
          return;
        }
      });
      //   this.setAttribute("clicked", "checked");
      // this.checked
      //   console.log("checked", this.checked);
      //   console.log(this);
    } else {
      selectedNodes.forEach((item, index) => {
        if (item.__data__.name == nodeId) {
          connectedNodes1(item);
        } else {
          return;
        }
      });
      //   this.setAttribute("clicked", "checked");
      //   console.log("unchecked", this.checked);
    }
  }

  // draw text for the labels

  var text = g
    .append("g")
    .attr("class", "labels")
    .selectAll("text")
    .data(nodes_data)
    .enter()
    .append("text")
    .attr("font-size", fontSize) //change fontsize below
    .text(function (d) {
      return d.name;
    })
    .attr("text-anchor", "middle")
    .attr("font-family", "Helvetica")
    .style("font-weight", 10)
    .style("pointer-events", "none")
    .style("fill", "black")
    .style("stroke", "black")
    .style("stroke-width", 0.1)
    .attr("dominant-baseline", "middle");

  //add drag capabilities
  var drag_handler = d3
    .drag()
    .on("start", drag_start)
    .on("drag", drag_drag)
    .on("end", drag_end);

  drag_handler(node);

  /** Functions **/

  function underline(d) {
    if (d.name.toLowerCase().includes(searchLabel)) {
      console.log(d.name);
      // console.log(found)
      return "underline";
    } else {
      return "none";
    }
  }

  //Function to choose what color circle we have
  //Let's return blue for males and red for females
  function circleColour(d) {
    if (d.type == "member") {
      return "#ff8c69";
    } else {
      return "#8aded8";
    }
    // if (d.group == "Audio Archives") {
    //   return "#ffe135";
    // }
    // if (d.group == "Avant-garde") {
    //   return "#ff8c69";
    // }
    // if (d.group == "The Black Arts Movement") {
    //   return "#f6adc6";
    // }
    // if (d.group == "Emergent Poets") {
    //   return "#bcee68";
    // }
    // if (d.group == "The Feminist Poetry Movement") {
    //   return "#00bfff";
    // }
    // if (d.group == "New Formalism") {
    //   return "#6f00ff";
    // }
    // if (d.group == "Teaching/Survey") {
    //   return "#ff3e96";
    // }
    // {
    //   return "#8aded8";
    // }
  }

  //Function to choose the font size
  //If the link type is member, return a size function
  //If the link type is Institution, return another size function

  function fontSize(d) {
    if (d.type == "member") {
      //edges type
      return d.linkCount ? (d.linkCount + 10) * 0.45 : 2;
    } else {
      return d.linkCount ? d.linkCount * 0.15 : 2; // d.linkCount ? d.linkCount * 0.15 : 2; //alternatively "(d.linkCount < 5) ? d.linkCount * 3 : d.linkCount * .3"
    }
  }

  //node size depending on the two groups
  function nodeSize(d) {
    if (d.type == "member") {
      //edges type
      return d.linkCount ? (d.linkCount + 4) * 0.5 : 3; // (d.linkCount < 3) ? d.linkCount * 3 : d.linkCount * 1.5;
    } else {
      return d.linkCount ? (d.linkCount + 5) * 0.2 : 2; // d.linkCount ? d.linkCount * 0.2 : 5; //alternatively "(d.linkCount < 5) ? d.linkCount * 3 : d.linkCount * .3"
    }
  }

  //Function to choose the line color and thickness
  //If the link type is "A" return green
  //If the link type is "E" return red

  function linkColour(d) {
    if (d.type == "member") {
      //edges type
      return "#d98686";
    } else {
      return "red";
    }
  }

  //Drag functions
  //d is the node
  function drag_start(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  //make sure you can't drag the circle outside the box
  function drag_drag(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function drag_end(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  //Zoom functions
  function zoom_actions() {
    g.attr("transform", d3.event.transform);
  }

  function tickActions() {
    //update circle positions each tick of the simulation
    node
      .attr("cx", function (d) {
        return d.x;
      })
      .attr("cy", function (d) {
        return d.y;
      });

    //update link positions
    link
      .attr("x1", function (d) {
        return d.source.x;
      })
      .attr("y1", function (d) {
        return d.source.y;
      })
      .attr("x2", function (d) {
        return d.target.x;
      })
      .attr("y2", function (d) {
        return d.target.y;
      });

    //update text positions
    text
      .attr("x", function (d) {
        return d.x;
      })
      .attr("y", function (d) {
        return d.y;
      });
  }
}

/*

nodes_data = [
	{
		"name": "Vito Acconci",
		"type": "member"
	},
	{
		"name": "Kathy Acker",
		"type": "member"
	},
	{
		"name": "Diane Ackerman",
		"type": "member"
	},
	{
		"name": "Helen Adam",
		"type": "member"
	},
	{
		"name": "Etel Adnan",
		"type": "member"
	},
	{
		"name": "Ai",
		"type": "member"
	},
	{
		"name": "Rosa Alcalá",
		"type": "member"
	},
	{
		"name": "Elizabeth Alexander",
		"type": "member"
	},
	{
		"name": "Will Alexander",
		"type": "member"
	},
	{
		"name": "Sherman Alexie",
		"type": "member"
	},
	{
		"name": "Agha Shahid Ali",
		"type": "member"
	},
	{
		"name": "Dick Allen",
		"type": "member"
	},
	{
		"name": "Nell Altizer",
		"type": "member"
	},
	{
		"name": "Julia Alvarez",
		"type": "member"
	},
	{
		"name": "Kingsley Amis",
		"type": "member"
	},
	{
		"name": "A. R. Ammons",
		"type": "member"
	},
	{
		"name": "Daniel Anderson",
		"type": "member"
	},
	{
		"name": "Jon Anderson",
		"type": "member"
	},
	{
		"name": "Bruce Andrews",
		"type": "member"
	},
	{
		"name": "David Antin",
		"type": "member"
	},
	{
		"name": "Louis Aragon",
		"type": "member"
	},
	{
		"name": "Rae Armantrout",
		"type": "member"
	},
	{
		"name": "John Ashbery",
		"type": "member"
	},
	{
		"name": "Jimmy Santiago Baca",
		"type": "member"
	},
	{
		"name": "David Baker",
		"type": "member"
	},
	{
		"name": "Peter Balakian",
		"type": "member"
	},
	{
		"name": "Mary Jo Bang",
		"type": "member"
	},
	{
		"name": "Amiri Baraka (LeRoi Jones)",
		"type": "member"
	},
	{
		"name": "Judith Barrington",
		"type": "member"
	},
	{
		"name": "Bruce Bawer",
		"type": "member"
	},
	{
		"name": "Dan Beachy-Quick",
		"type": "member"
	},
	{
		"name": "Ray A. Young Bear",
		"type": "member"
	},
	{
		"name": "Paul Beatty",
		"type": "member"
	},
	{
		"name": "Joshua Beckman",
		"type": "member"
	},
	{
		"name": "Samuel Beckett",
		"type": "member"
	},
	{
		"name": "Cal Bedient",
		"type": "member"
	},
	{
		"name": "Josh Bell",
		"type": "member"
	},
	{
		"name": "Marvin Bell",
		"type": "member"
	},
	{
		"name": "William Bell",
		"type": "member"
	},
	{
		"name": "Dodie Bellamy",
		"type": "member"
	},
	{
		"name": "Martine Bellen",
		"type": "member"
	},
	{
		"name": "Molly Bendall",
		"type": "member"
	},
	{
		"name": "Michael Benedikt",
		"type": "member"
	},
	{
		"name": "Bruce Bennett",
		"type": "member"
	},
	{
		"name": "Louise Bennett",
		"type": "member"
	},
	{
		"name": "John Bensko",
		"type": "member"
	},
	{
		"name": "Steve Benson",
		"type": "member"
	},
	{
		"name": "Caroline Bergvall",
		"type": "member"
	},
	{
		"name": "Bill Berkson",
		"type": "member"
	},
	{
		"name": "Alan Bernheimer",
		"type": "member"
	},
	{
		"name": "Charles Bernstein",
		"type": "member"
	},
	{
		"name": "Ted Berrigan",
		"type": "member"
	},
	{
		"name": "John Berryman",
		"type": "member"
	},
	{
		"name": "Mei-mei Berssenbrugge",
		"type": "member"
	},
	{
		"name": "James Bertram",
		"type": "member"
	},
	{
		"name": "Jen Bervin",
		"type": "member"
	},
	{
		"name": "Frank Bidart",
		"type": "member"
	},
	{
		"name": "Elizabeth Bishop",
		"type": "member"
	},
	{
		"name": "Sherwin Bitsui",
		"type": "member"
	},
	{
		"name": "Paul Blackburn",
		"type": "member"
	},
	{
		"name": "Brian Blanchfield",
		"type": "member"
	},
	{
		"name": "Robin Blaser",
		"type": "member"
	},
	{
		"name": "Chana Bloch",
		"type": "member"
	},
	{
		"name": "Ron Block",
		"type": "member"
	},
	{
		"name": "Michael Blumenthal",
		"type": "member"
	},
	{
		"name": "Robert Bly",
		"type": "member"
	},
	{
		"name": "Louise Bogan",
		"type": "member"
	},
	{
		"name": "Christian Bök",
		"type": "member"
	},
	{
		"name": "Eavan Boland",
		"type": "member"
	},
	{
		"name": "Philip Booth",
		"type": "member"
	},
	{
		"name": "Daniel Borzutzky",
		"type": "member"
	},
	{
		"name": "David Bottoms",
		"type": "member"
	},
	{
		"name": "Anne Boyer",
		"type": "member"
	},
	{
		"name": "Edgar Bowers",
		"type": "member"
	},
	{
		"name": "Kamau Brathwaite",
		"type": "member"
	},
	{
		"name": "George Brecht",
		"type": "member"
	},
	{
		"name": "John Bricuth",
		"type": "member"
	},
	{
		"name": "Van K. Brock",
		"type": "member"
	},
	{
		"name": "Jim Brodey",
		"type": "member"
	},
	{
		"name": "William Bronk",
		"type": "member"
	},
	{
		"name": "Gwendolyn Brooks",
		"type": "member"
	},
	{
		"name": "Nicole Brossard",
		"type": "member"
	},
	{
		"name": "Lee Ann Brown",
		"type": "member"
	},
	{
		"name": "Rosellen Brown",
		"type": "member"
	},
	{
		"name": "Sterling A. Brown",
		"type": "member"
	},
	{
		"name": "Laynie Browne",
		"type": "member"
	},
	{
		"name": "Michael Dennis Browne",
		"type": "member"
	},
	{
		"name": "Michael Brownstein",
		"type": "member"
	},
	{
		"name": "Debra Bruce",
		"type": "member"
	},
	{
		"name": "Sharon Bryan",
		"type": "member"
	},
	{
		"name": "Julia Budenz",
		"type": "member"
	},
	{
		"name": "Charles Bukowski",
		"type": "member"
	},
	{
		"name": "Michael Burkard",
		"type": "member"
	},
	{
		"name": "Stanley Burnshaw",
		"type": "member"
	},
	{
		"name": "William S. Burroughs",
		"type": "member"
	},
	{
		"name": "David Buuck",
		"type": "member"
	},
	{
		"name": "John Cage",
		"type": "member"
	},
	{
		"name": "Rafael Campo",
		"type": "member"
	},
	{
		"name": "Augusto de Campos",
		"type": "member"
	},
	{
		"name": "Haroldo de Campos",
		"type": "member"
	},
	{
		"name": "Melissa Cannon",
		"type": "member"
	},
	{
		"name": "Henri Chopin",
		"type": "member"
	},
	{
		"name": "Nick Carbó",
		"type": "member"
	},
	{
		"name": "Henry Carlile",
		"type": "member"
	},
	{
		"name": "Julie Carr",
		"type": "member"
	},
	{
		"name": "Hayden Carruth",
		"type": "member"
	},
	{
		"name": "Turner Cassity",
		"type": "member"
	},
	{
		"name": "Charles Causley",
		"type": "member"
	},
	{
		"name": "Joseph Ceravolo",
		"type": "member"
	},
	{
		"name": "Lorna Dee Cervantes",
		"type": "member"
	},
	{
		"name": "Fred Chappell",
		"type": "member"
	},
	{
		"name": "Maxine Chernoff",
		"type": "member"
	},
	{
		"name": "Kelly Cherry",
		"type": "member"
	},
	{
		"name": "Abigail Child",
		"type": "member"
	},
	{
		"name": "Marilyn Chin",
		"type": "member"
	},
	{
		"name": "Nicholas Christopher",
		"type": "member"
	},
	{
		"name": "John Ciardi",
		"type": "member"
	},
	{
		"name": "Sandra Cisneros",
		"type": "member"
	},
	{
		"name": "Amy Clampitt",
		"type": "member"
	},
	{
		"name": "Cheryl Clarke",
		"type": "member"
	},
	{
		"name": "Carlfriedrich Claus",
		"type": "member"
	},
	{
		"name": "Lucille Clifton",
		"type": "member"
	},
	{
		"name": "Claude Closky",
		"type": "member"
	},
	{
		"name": "Joshua Clover",
		"type": "member"
	},
	{
		"name": "Bob Cobbing",
		"type": "member"
	},
	{
		"name": "Henri Cole",
		"type": "member"
	},
	{
		"name": "Norma Cole",
		"type": "member"
	},
	{
		"name": "Wanda Coleman",
		"type": "member"
	},
	{
		"name": "Martha Collins",
		"type": "member"
	},
	{
		"name": "Conyus",
		"type": "member"
	},
	{
		"name": "Peter Cooley",
		"type": "member"
	},
	{
		"name": "Clark Coolidge",
		"type": "member"
	},
	{
		"name": "Dennis Cooper",
		"type": "member"
	},
	{
		"name": "Jane Cooper",
		"type": "member"
	},
	{
		"name": "William Corbett",
		"type": "member"
	},
	{
		"name": "Martin Corless-Smith",
		"type": "member"
	},
	{
		"name": "Cid Corman",
		"type": "member"
	},
	{
		"name": "Alfred Corn",
		"type": "member"
	},
	{
		"name": "Gregory Corso",
		"type": "member"
	},
	{
		"name": "Jayne Cortez",
		"type": "member"
	},
	{
		"name": "Gerald Costanzo",
		"type": "member"
	},
	{
		"name": "Henri Coulette",
		"type": "member"
	},
	{
		"name": "Hart Crane",
		"type": "member"
	},
	{
		"name": "Robert Creeley",
		"type": "member"
	},
	{
		"name": "Victor Hernández Cruz",
		"type": "member"
	},
	{
		"name": "J. V. Cunningham",
		"type": "member"
	},
	{
		"name": "Philip Dacey",
		"type": "member"
	},
	{
		"name": "Beverly Dahlen",
		"type": "member"
	},
	{
		"name": "Maria Damon",
		"type": "member"
	},
	{
		"name": "Tina Darragh",
		"type": "member"
	},
	{
		"name": "Glover David",
		"type": "member"
	},
	{
		"name": "Michael Davidson",
		"type": "member"
	},
	{
		"name": "Donald Davie",
		"type": "member"
	},
	{
		"name": "Alan Davies",
		"type": "member"
	},
	{
		"name": "Catherine Davis",
		"type": "member"
	},
	{
		"name": "Jordan Davis",
		"type": "member"
	},
	{
		"name": "Lydia Davis",
		"type": "member"
	},
	{
		"name": "Olena Kalytiak Davis",
		"type": "member"
	},
	{
		"name": "Peter Davison",
		"type": "member"
	},
	{
		"name": "Jean Day",
		"type": "member"
	},
	{
		"name": "Walter De Maria",
		"type": "member"
	},
	{
		"name": "Mónica de la Torre",
		"type": "member"
	},
	{
		"name": "Edwin Denby",
		"type": "member"
	},
	{
		"name": "Jeff Derksen",
		"type": "member"
	},
	{
		"name": "Toi Derricotte",
		"type": "member"
	},
	{
		"name": "Babette Deutsch",
		"type": "member"
	},
	{
		"name": "Thomas Devaney",
		"type": "member"
	},
	{
		"name": "Christopher Dewdney",
		"type": "member"
	},
	{
		"name": "W. S. Di Piero",
		"type": "member"
	},
	{
		"name": "James Dickey",
		"type": "member"
	},
	{
		"name": "Emily Dickinson",
		"type": "member"
	},
	{
		"name": "Linh Dinh",
		"type": "member"
	},
	{
		"name": "Ray DiPalma",
		"type": "member"
	},
	{
		"name": "Thomas M. Disch",
		"type": "member"
	},
	{
		"name": "Marcel Duchamp",
		"type": "member"
	},
	{
		"name": "Stephen Dobyns",
		"type": "member"
	},
	{
		"name": "Owen Dodson",
		"type": "member"
	},
	{
		"name": "Timothy Donnelly",
		"type": "member"
	},
	{
		"name": "Stacy Doris",
		"type": "member"
	},
	{
		"name": "Edward Dorn",
		"type": "member"
	},
	{
		"name": "Mark Doty",
		"type": "member"
	},
	{
		"name": "Keith Douglas",
		"type": "member"
	},
	{
		"name": "Rita Dove",
		"type": "member"
	},
	{
		"name": "Philip Dow",
		"type": "member"
	},
	{
		"name": "Suzanne J. Doyle",
		"type": "member"
	},
	{
		"name": "Lynne Dreyer",
		"type": "member"
	},
	{
		"name": "Johanna Drucker",
		"type": "member"
	},
	{
		"name": "Norman Dubie",
		"type": "member"
	},
	{
		"name": "Alan Dugan",
		"type": "member"
	},
	{
		"name": "Denise Duhamel",
		"type": "member"
	},
	{
		"name": "Robert Duncan",
		"type": "member"
	},
	{
		"name": "Stephen Dunn",
		"type": "member"
	},
	{
		"name": "Rachel Blau DuPlessis",
		"type": "member"
	},
	{
		"name": "Craig Dworkin",
		"type": "member"
	},
	{
		"name": "Bob Dylan",
		"type": "member"
	},
	{
		"name": "Richard Eberhart",
		"type": "member"
	},
	{
		"name": "Russell Edson",
		"type": "member"
	},
	{
		"name": "Gretel Ehrlich",
		"type": "member"
	},
	{
		"name": "Larry Eigner",
		"type": "member"
	},
	{
		"name": "Thomas Sayers Ellis",
		"type": "member"
	},
	{
		"name": "Kenward Elmslie",
		"type": "member"
	},
	{
		"name": "Laura Elrick",
		"type": "member"
	},
	{
		"name": "Lynn Emanuel",
		"type": "member"
	},
	{
		"name": "John Engels",
		"type": "member"
	},
	{
		"name": "Daniel Mark Epstein",
		"type": "member"
	},
	{
		"name": "Elaine Equi",
		"type": "member"
	},
	{
		"name": "Clayton Eshleman",
		"type": "member"
	},
	{
		"name": "Martín Espada",
		"type": "member"
	},
	{
		"name": "Rhina P. Espaillat",
		"type": "member"
	},
	{
		"name": "George Evans",
		"type": "member"
	},
	{
		"name": "Peter Everwine",
		"type": "member"
	},
	{
		"name": "Dan Farrell",
		"type": "member"
	},
	{
		"name": "Julie Fay",
		"type": "member"
	},
	{
		"name": "Frederick Feirstein",
		"type": "member"
	},
	{
		"name": "Irving Feldman",
		"type": "member"
	},
	{
		"name": "Susan Feldman",
		"type": "member"
	},
	{
		"name": "Lawrence Ferlinghetti",
		"type": "member"
	},
	{
		"name": "Edward Field",
		"type": "member"
	},
	{
		"name": "Annie Finch",
		"type": "member"
	},
	{
		"name": "Donald Finkel",
		"type": "member"
	},
	{
		"name": "Robert Fitterman",
		"type": "member"
	},
	{
		"name": "Nick Flynn",
		"type": "member"
	},
	{
		"name": "Calvin Forbes",
		"type": "member"
	},
	{
		"name": "Carolyn Forché",
		"type": "member"
	},
	{
		"name": "Kathleen Fraser",
		"type": "member"
	},
	{
		"name": "Benjamin Friedlander",
		"type": "member"
	},
	{
		"name": "Carol Frost",
		"type": "member"
	},
	{
		"name": "Joanna Fuhrman",
		"type": "member"
	},
	{
		"name": "Heather Fuller",
		"type": "member"
	},
	{
		"name": "Alice Fulton",
		"type": "member"
	},
	{
		"name": "Christopher Funkhouser",
		"type": "member"
	},
	{
		"name": "Tess Gallagher",
		"type": "member"
	},
	{
		"name": "James Galvin",
		"type": "member"
	},
	{
		"name": "Forrest Gander",
		"type": "member"
	},
	{
		"name": "Suzanne Gardinier",
		"type": "member"
	},
	{
		"name": "Drew Gardner",
		"type": "member"
	},
	{
		"name": "Isabella Gardner",
		"type": "member"
	},
	{
		"name": "Ilse Garnier",
		"type": "member"
	},
	{
		"name": "Pierre Garnier",
		"type": "member"
	},
	{
		"name": "George Garrett",
		"type": "member"
	},
	{
		"name": "Jean Garrigue",
		"type": "member"
	},
	{
		"name": "Joan Austin Geier",
		"type": "member"
	},
	{
		"name": "Susan Gevirtz",
		"type": "member"
	},
	{
		"name": "Reginald Gibbons",
		"type": "member"
	},
	{
		"name": "Margaret Gibson",
		"type": "member"
	},
	{
		"name": "Lawrence Giffin",
		"type": "member"
	},
	{
		"name": "Christopher Gilbert",
		"type": "member"
	},
	{
		"name": "Gary Gildner",
		"type": "member"
	},
	{
		"name": "Carmen Giménez Smith",
		"type": "member"
	},
	{
		"name": "Madeline Gins",
		"type": "member"
	},
	{
		"name": "Allen Ginsberg",
		"type": "member"
	},
	{
		"name": "Dana Gioia",
		"type": "member"
	},
	{
		"name": "John Giorno",
		"type": "member"
	},
	{
		"name": "Nikki Giovanni",
		"type": "member"
	},
	{
		"name": "C. S. Giscombe",
		"type": "member"
	},
	{
		"name": "Peter Gizzi",
		"type": "member"
	},
	{
		"name": "Louise Glück",
		"type": "member"
	},
	{
		"name": "John Godfrey",
		"type": "member"
	},
	{
		"name": "Patricia Goedicke",
		"type": "member"
	},
	{
		"name": "Albert Goldbarth",
		"type": "member"
	},
	{
		"name": "Judith Goldman",
		"type": "member"
	},
	{
		"name": "Kenneth Goldsmith",
		"type": "member"
	},
	{
		"name": "Eugen Gomringer",
		"type": "member"
	},
	{
		"name": "Rigoberto González",
		"type": "member"
	},
	{
		"name": "Nada Gordon",
		"type": "member"
	},
	{
		"name": "Sarah Gorham",
		"type": "member"
	},
	{
		"name": "Michael Gottlieb",
		"type": "member"
	},
	{
		"name": "Dan Graham",
		"type": "member"
	},
	{
		"name": "Jorie Graham",
		"type": "member"
	},
	{
		"name": "K. Lorraine Graham",
		"type": "member"
	},
	{
		"name": "W. S. Graham",
		"type": "member"
	},
	{
		"name": "Barbara L. Greenberg",
		"type": "member"
	},
	{
		"name": "Ted Greenwald",
		"type": "member"
	},
	{
		"name": "Jane Greer",
		"type": "member"
	},
	{
		"name": "Debora Greger",
		"type": "member"
	},
	{
		"name": "Linda Gregg",
		"type": "member"
	},
	{
		"name": "Robert Grenier",
		"type": "member"
	},
	{
		"name": "Emily Grosholz",
		"type": "member"
	},
	{
		"name": "Barbara Guest",
		"type": "member"
	},
	{
		"name": "Charles Gullans",
		"type": "member"
	},
	{
		"name": "Thom Gunn",
		"type": "member"
	},
	{
		"name": "R. S. Gwynn",
		"type": "member"
	},
	{
		"name": "Brion Gysin",
		"type": "member"
	},
	{
		"name": "H.D.",
		"type": "member"
	},
	{
		"name": "Marilyn Hacker",
		"type": "member"
	},
	{
		"name": "Rachel Hadas",
		"type": "member"
	},
	{
		"name": "Kimiko Hahn",
		"type": "member"
	},
	{
		"name": "Donald Hall",
		"type": "member"
	},
	{
		"name": "Mark Halperin",
		"type": "member"
	},
	{
		"name": "Daniel Halpern",
		"type": "member"
	},
	{
		"name": "Michael Hamburger",
		"type": "member"
	},
	{
		"name": "Al Hansen",
		"type": "member"
	},
	{
		"name": "Joy Harjo",
		"type": "member"
	},
	{
		"name": "Edward Harkness",
		"type": "member"
	},
	{
		"name": "Michael S. Harper",
		"type": "member"
	},
	{
		"name": "William J. Harris",
		"type": "member"
	},
	{
		"name": "Jim Harrison",
		"type": "member"
	},
	{
		"name": "Elizabeth B. Harrod",
		"type": "member"
	},
	{
		"name": "Carla Harryman",
		"type": "member"
	},
	{
		"name": "Charles O. Hartman",
		"type": "member"
	},
	{
		"name": "Matthea Harvey",
		"type": "member"
	},
	{
		"name": "Robert Hass",
		"type": "member"
	},
	{
		"name": "William Hathaway",
		"type": "member"
	},
	{
		"name": "Vaclav Havel",
		"type": "member"
	},
	{
		"name": "Robert Hayden",
		"type": "member"
	},
	{
		"name": "Terrance Hayes",
		"type": "member"
	},
	{
		"name": "Seamus Heaney",
		"type": "member"
	},
	{
		"name": "John Heath-Stubbs",
		"type": "member"
	},
	{
		"name": "Anthony Hecht",
		"type": "member"
	},
	{
		"name": "Allison Adelle Hedge Coke",
		"type": "member"
	},
	{
		"name": "Michael Heffernan",
		"type": "member"
	},
	{
		"name": "Lyn Hejinian",
		"type": "member"
	},
	{
		"name": "Judith Hemschemeyer",
		"type": "member"
	},
	{
		"name": "William Heyen",
		"type": "member"
	},
	{
		"name": "Bob Hicok",
		"type": "member"
	},
	{
		"name": "Dick Higgins",
		"type": "member"
	},
	{
		"name": "Mitch Highfill",
		"type": "member"
	},
	{
		"name": "Geoffrey Hill",
		"type": "member"
	},
	{
		"name": "Brenda Hillman",
		"type": "member"
	},
	{
		"name": "Edward Hirsch",
		"type": "member"
	},
	{
		"name": "Åke Hodell",
		"type": "member"
	},
	{
		"name": "Daniel Hoffman",
		"type": "member"
	},
	{
		"name": "Linda Hogan",
		"type": "member"
	},
	{
		"name": "Jonathan Holden",
		"type": "member"
	},
	{
		"name": "John Hollander",
		"type": "member"
	},
	{
		"name": "Anselm Hollo",
		"type": "member"
	},
	{
		"name": "John Holloway",
		"type": "member"
	},
	{
		"name": "John Holmes",
		"type": "member"
	},
	{
		"name": "Cathy Park Hong",
		"type": "member"
	},
	{
		"name": "Garrett Kaoru Hongo",
		"type": "member"
	},
	{
		"name": "Paul Hoover",
		"type": "member"
	},
	{
		"name": "David Brendan Hopes",
		"type": "member"
	},
	{
		"name": "Ben Howard",
		"type": "member"
	},
	{
		"name": "Richard Howard",
		"type": "member"
	},
	{
		"name": "Fanny Howe",
		"type": "member"
	},
	{
		"name": "Susan Howe",
		"type": "member"
	},
	{
		"name": "Barbara Howes",
		"type": "member"
	},
	{
		"name": "Andrew Hudgins",
		"type": "member"
	},
	{
		"name": "Yunte Huang",
		"type": "member"
	},
	{
		"name": "Robert Huff",
		"type": "member"
	},
	{
		"name": "Langston Hughes",
		"type": "member"
	},
	{
		"name": "Richard Hugo",
		"type": "member"
	},
	{
		"name": "Christine Hume",
		"type": "member"
	},
	{
		"name": "T. R. Hummer",
		"type": "member"
	},
	{
		"name": "Erica Hunt",
		"type": "member"
	},
	{
		"name": "David Ignatow",
		"type": "member"
	},
	{
		"name": "Lawson Fusao Inada",
		"type": "member"
	},
	{
		"name": "P. Inman (Peter Inman)",
		"type": "member"
	},
	{
		"name": "Kenneth Irby",
		"type": "member"
	},
	{
		"name": "Josephine Jacobsen",
		"type": "member"
	},
	{
		"name": "Peter Jaeger",
		"type": "member"
	},
	{
		"name": "Elizabeth James",
		"type": "member"
	},
	{
		"name": "Thomas James",
		"type": "member"
	},
	{
		"name": "Ernst Jandl",
		"type": "member"
	},
	{
		"name": "Mark Jarman",
		"type": "member"
	},
	{
		"name": "Lisa Jarnot",
		"type": "member"
	},
	{
		"name": "Randall Jarrell",
		"type": "member"
	},
	{
		"name": "Elizabeth Jennings",
		"type": "member"
	},
	{
		"name": "Laura Jensen",
		"type": "member"
	},
	{
		"name": "Judson Jerome",
		"type": "member"
	},
	{
		"name": "Denis Johnson",
		"type": "member"
	},
	{
		"name": "Don Johnson",
		"type": "member"
	},
	{
		"name": "James Weldon Johnson",
		"type": "member"
	},
	{
		"name": "\"Raymond Edward \"\"Ray\"\" Johnson\"",
		"type": "member"
	},
	{
		"name": "Ronald Johnson",
		"type": "member"
	},
	{
		"name": "Rodney Jones",
		"type": "member"
	},
	{
		"name": "Erica Jong",
		"type": "member"
	},
	{
		"name": "A. Van Jordan",
		"type": "member"
	},
	{
		"name": "June Jordan",
		"type": "member"
	},
	{
		"name": "Andrew Joron",
		"type": "member"
	},
	{
		"name": "Allison Joseph",
		"type": "member"
	},
	{
		"name": "Donald Justice",
		"type": "member"
	},
	{
		"name": "Ilya Kaminsky",
		"type": "member"
	},
	{
		"name": "Bhanu Kapil",
		"type": "member"
	},
	{
		"name": "Laura Kasischke",
		"type": "member"
	},
	{
		"name": "Joy Katz",
		"type": "member"
	},
	{
		"name": "Ellen de Young Kay",
		"type": "member"
	},
	{
		"name": "Richard Katrovas",
		"type": "member"
	},
	{
		"name": "Claudia Keelan",
		"type": "member"
	},
	{
		"name": "Greg Keeler",
		"type": "member"
	},
	{
		"name": "Weldon Kees",
		"type": "member"
	},
	{
		"name": "Lenore Keeshit-Tobias",
		"type": "member"
	},
	{
		"name": "Robert Kelly",
		"type": "member"
	},
	{
		"name": "Dolores Kendrick",
		"type": "member"
	},
	{
		"name": "X. J. Kennedy",
		"type": "member"
	},
	{
		"name": "Jane Kenyon",
		"type": "member"
	},
	{
		"name": "Jack Kerouac",
		"type": "member"
	},
	{
		"name": "Faye Kicknosway",
		"type": "member"
	},
	{
		"name": "Myung Mi Kim",
		"type": "member"
	},
	{
		"name": "Suji Kwock Kim",
		"type": "member"
	},
	{
		"name": "Galway Kinnell",
		"type": "member"
	},
	{
		"name": "Thomas Kinsella",
		"type": "member"
	},
	{
		"name": "Mary Kinzie",
		"type": "member"
	},
	{
		"name": "Carolyn Kizer",
		"type": "member"
	},
	{
		"name": "Peter Klappert",
		"type": "member"
	},
	{
		"name": "August Kleinzahler",
		"type": "member"
	},
	{
		"name": "Etheridge Knight",
		"type": "member"
	},
	{
		"name": "Bill Knott (Saint Geraud)",
		"type": "member"
	},
	{
		"name": "Christopher Knowles",
		"type": "member"
	},
	{
		"name": "Caroline Knox",
		"type": "member"
	},
	{
		"name": "Kenneth Koch",
		"type": "member"
	},
	{
		"name": "Rodney Koeneke",
		"type": "member"
	},
	{
		"name": "Phyllis Koestenbaum",
		"type": "member"
	},
	{
		"name": "Sybil Kollar",
		"type": "member"
	},
	{
		"name": "Yusef Komunyakaa",
		"type": "member"
	},
	{
		"name": "Ted Kooser",
		"type": "member"
	},
	{
		"name": "Aaron Kramer",
		"type": "member"
	},
	{
		"name": "Judith Kroll",
		"type": "member"
	},
	{
		"name": "Maxine Kumin",
		"type": "member"
	},
	{
		"name": "Stanley Kunitz",
		"type": "member"
	},
	{
		"name": "Greg Kuzma",
		"type": "member"
	},
	{
		"name": "Joanne Kyger",
		"type": "member"
	},
	{
		"name": "Melvin Walker La Follette",
		"type": "member"
	},
	{
		"name": "Joan LaBombard",
		"type": "member"
	},
	{
		"name": "Philip Lamantia",
		"type": "member"
	},
	{
		"name": "Joseph Langland",
		"type": "member"
	},
	{
		"name": "Philip Larkin",
		"type": "member"
	},
	{
		"name": "Paul Lake",
		"type": "member"
	},
	{
		"name": "James Laughlin",
		"type": "member"
	},
	{
		"name": "Ann Lauterbach",
		"type": "member"
	},
	{
		"name": "Robert Layzer",
		"type": "member"
	},
	{
		"name": "Sydney Lea",
		"type": "member"
	},
	{
		"name": "Joseph Lease",
		"type": "member"
	},
	{
		"name": "Al Lee",
		"type": "member"
	},
	{
		"name": "Li-Young Lee",
		"type": "member"
	},
	{
		"name": "Barbara Lefcowitz",
		"type": "member"
	},
	{
		"name": "David Lehman",
		"type": "member"
	},
	{
		"name": "Leevi Lehto",
		"type": "member"
	},
	{
		"name": "Brad Leithauser",
		"type": "member"
	},
	{
		"name": "Ben Lerner",
		"type": "member"
	},
	{
		"name": "Rika Lesser",
		"type": "member"
	},
	{
		"name": "Denise Levertov",
		"type": "member"
	},
	{
		"name": "Dana Levin",
		"type": "member"
	},
	{
		"name": "Phillis Levin",
		"type": "member"
	},
	{
		"name": "Philip Levine",
		"type": "member"
	},
	{
		"name": "Fred Levinson",
		"type": "member"
	},
	{
		"name": "Larry Levis",
		"type": "member"
	},
	{
		"name": "Janet Lewis",
		"type": "member"
	},
	{
		"name": "Elizabeth Libbey",
		"type": "member"
	},
	{
		"name": "Tan Lin",
		"type": "member"
	},
	{
		"name": "Timothy Liu",
		"type": "member"
	},
	{
		"name": "John Logan",
		"type": "member"
	},
	{
		"name": "William Logan",
		"type": "member"
	},
	{
		"name": "Arrigo Lora-Totino",
		"type": "member"
	},
	{
		"name": "Audre Lorde",
		"type": "member"
	},
	{
		"name": "Robert Lowell",
		"type": "member"
	},
	{
		"name": "Susan Ludvigson",
		"type": "member"
	},
	{
		"name": "Thomas Lux",
		"type": "member"
	},
	{
		"name": "Karen Mac Cormack",
		"type": "member"
	},
	{
		"name": "Jackson Mac Low",
		"type": "member"
	},
	{
		"name": "Cynthia MacDonald",
		"type": "member"
	},
	{
		"name": "Nathaniel Mackey",
		"type": "member"
	},
	{
		"name": "Michael Magee",
		"type": "member"
	},
	{
		"name": "Gerald Malanga",
		"type": "member"
	},
	{
		"name": "Donato Mancini",
		"type": "member"
	},
	{
		"name": "Tom Mandel",
		"type": "member"
	},
	{
		"name": "Maurice Manning",
		"type": "member"
	},
	{
		"name": "Paul Mariani",
		"type": "member"
	},
	{
		"name": "Charles Martin",
		"type": "member"
	},
	{
		"name": "Valerie Martínez",
		"type": "member"
	},
	{
		"name": "David Mason",
		"type": "member"
	},
	{
		"name": "William Matchett",
		"type": "member"
	},
	{
		"name": "Harry Mathews",
		"type": "member"
	},
	{
		"name": "Cleopatra Mathis",
		"type": "member"
	},
	{
		"name": "Khaled Mattawa",
		"type": "member"
	},
	{
		"name": "William Matthews",
		"type": "member"
	},
	{
		"name": "Bernadette Mayer",
		"type": "member"
	},
	{
		"name": "Hansjörg Mayer",
		"type": "member"
	},
	{
		"name": "E. L. Mayo",
		"type": "member"
	},
	{
		"name": "Mekeel McBride",
		"type": "member"
	},
	{
		"name": "Angela McCabe",
		"type": "member"
	},
	{
		"name": "Steve McCaffery",
		"type": "member"
	},
	{
		"name": "Michael McClure",
		"type": "member"
	},
	{
		"name": "Howard McCord",
		"type": "member"
	},
	{
		"name": "David McElroy",
		"type": "member"
	},
	{
		"name": "Thomas McGrath",
		"type": "member"
	},
	{
		"name": "Medbh McGuckian",
		"type": "member"
	},
	{
		"name": "Heather McHugh",
		"type": "member"
	},
	{
		"name": "Stephen McLaughlin",
		"type": "member"
	},
	{
		"name": "James McMichael",
		"type": "member"
	},
	{
		"name": "Mark McMorris",
		"type": "member"
	},
	{
		"name": "Sandra McPherson",
		"type": "member"
	},
	{
		"name": "Joyelle McSweeney",
		"type": "member"
	},
	{
		"name": "Peter Meinke",
		"type": "member"
	},
	{
		"name": "David Meltzer",
		"type": "member"
	},
	{
		"name": "William Meredith",
		"type": "member"
	},
	{
		"name": "James Merrill",
		"type": "member"
	},
	{
		"name": "W. S. Merwin",
		"type": "member"
	},
	{
		"name": "Sharon Mesmer",
		"type": "member"
	},
	{
		"name": "Douglas Messerli",
		"type": "member"
	},
	{
		"name": "Robert Mezey",
		"type": "member"
	},
	{
		"name": "Josephine Miles",
		"type": "member"
	},
	{
		"name": "Edna St. Vincent Millay",
		"type": "member"
	},
	{
		"name": "Jane Miller",
		"type": "member"
	},
	{
		"name": "Vassar Miller",
		"type": "member"
	},
	{
		"name": "Carol Mirakove",
		"type": "member"
	},
	{
		"name": "Gary Miranda",
		"type": "member"
	},
	{
		"name": "Judith Moffett",
		"type": "member"
	},
	{
		"name": "K. Silem Mohammad",
		"type": "member"
	},
	{
		"name": "N. Scott Momaday",
		"type": "member"
	},
	{
		"name": "Franz Mon",
		"type": "member"
	},
	{
		"name": "Paul Monette",
		"type": "member"
	},
	{
		"name": "Leslie Monsour",
		"type": "member"
	},
	{
		"name": "Honor Moore",
		"type": "member"
	},
	{
		"name": "Richard Moore",
		"type": "member"
	},
	{
		"name": "Cherríe Moraga",
		"type": "member"
	},
	{
		"name": "Robert Morgan",
		"type": "member"
	},
	{
		"name": "Laura Moriarty",
		"type": "member"
	},
	{
		"name": "Hilda Morley",
		"type": "member"
	},
	{
		"name": "Tracie Morris",
		"type": "member"
	},
	{
		"name": "Rusty Morrison",
		"type": "member"
	},
	{
		"name": "Howard Moss",
		"type": "member"
	},
	{
		"name": "Stanley Moss",
		"type": "member"
	},
	{
		"name": "Fred Moten",
		"type": "member"
	},
	{
		"name": "Erin Mouré",
		"type": "member"
	},
	{
		"name": "Jennifer Moxley",
		"type": "member"
	},
	{
		"name": "Lisel Mueller",
		"type": "member"
	},
	{
		"name": "Paul Muldoon",
		"type": "member"
	},
	{
		"name": "Harryette Mullen",
		"type": "member"
	},
	{
		"name": "Laura Mullen",
		"type": "member"
	},
	{
		"name": "G. E. Murray",
		"type": "member"
	},
	{
		"name": "Les Murray",
		"type": "member"
	},
	{
		"name": "Carol Muske-Dukes",
		"type": "member"
	},
	{
		"name": "Jack Myers",
		"type": "member"
	},
	{
		"name": "Eileen Myles",
		"type": "member"
	},
	{
		"name": "Maurizio Nannucci",
		"type": "member"
	},
	{
		"name": "Melanie Neilson",
		"type": "member"
	},
	{
		"name": "Maggie Nelson",
		"type": "member"
	},
	{
		"name": "Marilyn Nelson",
		"type": "member"
	},
	{
		"name": "Howard Nemerov",
		"type": "member"
	},
	{
		"name": "bpNichol (Barrie Phillip Nichol)",
		"type": "member"
	},
	{
		"name": "Lorine Niedecker",
		"type": "member"
	},
	{
		"name": "Seiichi Niikuni",
		"type": "member"
	},
	{
		"name": "John Frederick Nims",
		"type": "member"
	},
	{
		"name": "Suzanne Noguere",
		"type": "member"
	},
	{
		"name": "Eiríkur Örn Norðdahl",
		"type": "member"
	},
	{
		"name": "Charles North",
		"type": "member"
	},
	{
		"name": "Alice Notley",
		"type": "member"
	},
	{
		"name": "Ladislav Novák",
		"type": "member"
	},
	{
		"name": "Mark Nowak",
		"type": "member"
	},
	{
		"name": "Naomi Shihab Nye",
		"type": "member"
	},
	{
		"name": "Frank O'Hara",
		"type": "member"
	},
	{
		"name": "Sharon Olds",
		"type": "member"
	},
	{
		"name": "Carole Oles",
		"type": "member"
	},
	{
		"name": "Mary Oliver",
		"type": "member"
	},
	{
		"name": "Redell Olsen",
		"type": "member"
	},
	{
		"name": "Charles Olson",
		"type": "member"
	},
	{
		"name": "Yoko Ono",
		"type": "member"
	},
	{
		"name": "George Oppen",
		"type": "member"
	},
	{
		"name": "Steve Orlen",
		"type": "member"
	},
	{
		"name": "Gregory Orr",
		"type": "member"
	},
	{
		"name": "Simon J. Ortiz",
		"type": "member"
	},
	{
		"name": "Maggie O'Sullivan",
		"type": "member"
	},
	{
		"name": "Maureen Owen",
		"type": "member"
	},
	{
		"name": "Rochelle Owens",
		"type": "member"
	},
	{
		"name": "Robert Pack",
		"type": "member"
	},
	{
		"name": "Ron Padgett",
		"type": "member"
	},
	{
		"name": "Nam June Paik",
		"type": "member"
	},
	{
		"name": "Grace Paley",
		"type": "member"
	},
	{
		"name": "Michael Palmer",
		"type": "member"
	},
	{
		"name": "Greg Pape",
		"type": "member"
	},
	{
		"name": "Jay Parini",
		"type": "member"
	},
	{
		"name": "Elsie Paschen",
		"type": "member"
	},
	{
		"name": "Linda Pastan",
		"type": "member"
	},
	{
		"name": "Kenneth Patchen",
		"type": "member"
	},
	{
		"name": "Julie Patton",
		"type": "member"
	},
	{
		"name": "Molly Peacock",
		"type": "member"
	},
	{
		"name": "John Peck",
		"type": "member"
	},
	{
		"name": "Georges Perec",
		"type": "member"
	},
	{
		"name": "Bob Perelman",
		"type": "member"
	},
	{
		"name": "Craig Santos Perez",
		"type": "member"
	},
	{
		"name": "John Perreault",
		"type": "member"
	},
	{
		"name": "Michael Pettit",
		"type": "member"
	},
	{
		"name": "M. Nourbese Philip",
		"type": "member"
	},
	{
		"name": "Marge Piercy",
		"type": "member"
	},
	{
		"name": "Helen Pinkerton",
		"type": "member"
	},
	{
		"name": "Robert Pinsky",
		"type": "member"
	},
	{
		"name": "Nick Piombino",
		"type": "member"
	},
	{
		"name": "Vanessa Place",
		"type": "member"
	},
	{
		"name": "Sylvia Plath",
		"type": "member"
	},
	{
		"name": "Stanley Plumly",
		"type": "member"
	},
	{
		"name": "Hyam Plutzik",
		"type": "member"
	},
	{
		"name": "Katha Pollitt",
		"type": "member"
	},
	{
		"name": "Bern Porter",
		"type": "member"
	},
	{
		"name": "Ezra Pound",
		"type": "member"
	},
	{
		"name": "D. A. Powell",
		"type": "member"
	},
	{
		"name": "Larry Price",
		"type": "member"
	},
	{
		"name": "Wyatt Prunty",
		"type": "member"
	},
	{
		"name": "Raymond Queneau",
		"type": "member"
	},
	{
		"name": "Lawrence Raab",
		"type": "member"
	},
	{
		"name": "Thomas Rabbitt",
		"type": "member"
	},
	{
		"name": "Carl Rakosi",
		"type": "member"
	},
	{
		"name": "A. K. Ramanujan",
		"type": "member"
	},
	{
		"name": "Bin Ramke",
		"type": "member"
	},
	{
		"name": "Dudley Randall",
		"type": "member"
	},
	{
		"name": "Paula Rankin",
		"type": "member"
	},
	{
		"name": "Claudia Rankine",
		"type": "member"
	},
	{
		"name": "Stephen Ratcliffe",
		"type": "member"
	},
	{
		"name": "Tom Raworth",
		"type": "member"
	},
	{
		"name": "David Ray",
		"type": "member"
	},
	{
		"name": "Srikanth Reddy",
		"type": "member"
	},
	{
		"name": "Ishmael Reed",
		"type": "member"
	},
	{
		"name": "Alastair Reid",
		"type": "member"
	},
	{
		"name": "Ariana Reines",
		"type": "member"
	},
	{
		"name": "James Reiss",
		"type": "member"
	},
	{
		"name": "Naomi Replansky",
		"type": "member"
	},
	{
		"name": "Joan Retallack",
		"type": "member"
	},
	{
		"name": "Donald Revell",
		"type": "member"
	},
	{
		"name": "Charles Reznikoff",
		"type": "member"
	},
	{
		"name": "Adrienne Rich",
		"type": "member"
	},
	{
		"name": "Deborah Richards",
		"type": "member"
	},
	{
		"name": "John Ridland",
		"type": "member"
	},
	{
		"name": "Alberto Álvaro Ríos",
		"type": "member"
	},
	{
		"name": "Ed Roberson",
		"type": "member"
	},
	{
		"name": "Lisa Robertson",
		"type": "member"
	},
	{
		"name": "Elizabeth Robinson",
		"type": "member"
	},
	{
		"name": "Kit Robinson",
		"type": "member"
	},
	{
		"name": "Stephen Rodefer",
		"type": "member"
	},
	{
		"name": "Theodore Roethke",
		"type": "member"
	},
	{
		"name": "Pattiann Rogers",
		"type": "member"
	},
	{
		"name": "Matthew Rohrer",
		"type": "member"
	},
	{
		"name": "William Pitt Root",
		"type": "member"
	},
	{
		"name": "Raymond Roseliep",
		"type": "member"
	},
	{
		"name": "Kenneth Rosen",
		"type": "member"
	},
	{
		"name": "Michael J. Rosen",
		"type": "member"
	},
	{
		"name": "Kim Rosenfield",
		"type": "member"
	},
	{
		"name": "Dieter Roth",
		"type": "member"
	},
	{
		"name": "Jerome Rothenberg",
		"type": "member"
	},
	{
		"name": "Gibbons Ruark",
		"type": "member"
	},
	{
		"name": "Mary Ruefle",
		"type": "member"
	},
	{
		"name": "Gerhard Rühm",
		"type": "member"
	},
	{
		"name": "Muriel Rukeyser",
		"type": "member"
	},
	{
		"name": "Michael Ryan",
		"type": "member"
	},
	{
		"name": "Ira Sadoff",
		"type": "member"
	},
	{
		"name": "Mary Jo Salter",
		"type": "member"
	},
	{
		"name": "Lisa Samuels",
		"type": "member"
	},
	{
		"name": "Sonia Sanchez",
		"type": "member"
	},
	{
		"name": "Kaia Sand",
		"type": "member"
	},
	{
		"name": "Sherod Santos",
		"type": "member"
	},
	{
		"name": "Aram Saroyan",
		"type": "member"
	},
	{
		"name": "May Sarton",
		"type": "member"
	},
	{
		"name": "Leslie Scalapino",
		"type": "member"
	},
	{
		"name": "Susan Fromberg Schaeffer",
		"type": "member"
	},
	{
		"name": "Roy Scheele",
		"type": "member"
	},
	{
		"name": "James Schevill",
		"type": "member"
	},
	{
		"name": "Dennis Schmitz",
		"type": "member"
	},
	{
		"name": "Gjertrud Schnackenberg",
		"type": "member"
	},
	{
		"name": "Philip Schultz",
		"type": "member"
	},
	{
		"name": "Susan M. Schultz",
		"type": "member"
	},
	{
		"name": "James Schuyler",
		"type": "member"
	},
	{
		"name": "Delmore Schwartz",
		"type": "member"
	},
	{
		"name": "Gail Scott",
		"type": "member"
	},
	{
		"name": "Winfield Townley Scott",
		"type": "member"
	},
	{
		"name": "Maureen Seaton",
		"type": "member"
	},
	{
		"name": "Peter Seaton",
		"type": "member"
	},
	{
		"name": "Hugh Seidman",
		"type": "member"
	},
	{
		"name": "Anne Sexton",
		"type": "member"
	},
	{
		"name": "Alan Shapiro",
		"type": "member"
	},
	{
		"name": "David Shapiro",
		"type": "member"
	},
	{
		"name": "Karl Shapiro",
		"type": "member"
	},
	{
		"name": "Brenda Shaughnessy",
		"type": "member"
	},
	{
		"name": "James Sherry",
		"type": "member"
	},
	{
		"name": "Judith Johnson Sherwin",
		"type": "member"
	},
	{
		"name": "Aaron Shurin",
		"type": "member"
	},
	{
		"name": "Eleni Sikelianos",
		"type": "member"
	},
	{
		"name": "Richard Siken",
		"type": "member"
	},
	{
		"name": "Jon Silkin",
		"type": "member"
	},
	{
		"name": "Leslie Marmon Silko",
		"type": "member"
	},
	{
		"name": "Ron Silliman",
		"type": "member"
	},
	{
		"name": "Charles Simic",
		"type": "member"
	},
	{
		"name": "Maurya Simon",
		"type": "member"
	},
	{
		"name": "Leslie Simon",
		"type": "member"
	},
	{
		"name": "Louis Simpson",
		"type": "member"
	},
	{
		"name": "L. E. Sissman",
		"type": "member"
	},
	{
		"name": "Knute Skinner",
		"type": "member"
	},
	{
		"name": "Floyd Skloot",
		"type": "member"
	},
	{
		"name": "David R. Slavitt",
		"type": "member"
	},
	{
		"name": "Patricia Smith",
		"type": "member"
	},
	{
		"name": "Dave Smith",
		"type": "member"
	},
	{
		"name": "Rod Smith",
		"type": "member"
	},
	{
		"name": "Tracy K. Smith",
		"type": "member"
	},
	{
		"name": "William Jay Smith",
		"type": "member"
	},
	{
		"name": "W. D. Snodgrass",
		"type": "member"
	},
	{
		"name": "Gary Snyder",
		"type": "member"
	},
	{
		"name": "Gustaf Sobin",
		"type": "member"
	},
	{
		"name": "Cathy Song",
		"type": "member"
	},
	{
		"name": "Gary Soto",
		"type": "member"
	},
	{
		"name": "Marcia Southwick",
		"type": "member"
	},
	{
		"name": "Barry Spacks",
		"type": "member"
	},
	{
		"name": "Juliana Spahr",
		"type": "member"
	},
	{
		"name": "Adriano Spatola",
		"type": "member"
	},
	{
		"name": "Roberta Spear",
		"type": "member"
	},
	{
		"name": "Jack Spicer",
		"type": "member"
	},
	{
		"name": "Elizabeth Spires",
		"type": "member"
	},
	{
		"name": "Kathleen Spivack",
		"type": "member"
	},
	{
		"name": "David St. John",
		"type": "member"
	},
	{
		"name": "William Stafford",
		"type": "member"
	},
	{
		"name": "Maura Stanton",
		"type": "member"
	},
	{
		"name": "George Starbuck",
		"type": "member"
	},
	{
		"name": "Timothy Steele",
		"type": "member"
	},
	{
		"name": "Brian Kim Stefans",
		"type": "member"
	},
	{
		"name": "Gertrude Stein",
		"type": "member"
	},
	{
		"name": "Barry Sternlieb",
		"type": "member"
	},
	{
		"name": "Wallace Stevens",
		"type": "member"
	},
	{
		"name": "Anne Stevenson",
		"type": "member"
	},
	{
		"name": "Susan Stewart",
		"type": "member"
	},
	{
		"name": "Terry Stokes",
		"type": "member"
	},
	{
		"name": "Leon Stokesbury",
		"type": "member"
	},
	{
		"name": "Patricia Storace",
		"type": "member"
	},
	{
		"name": "Ruth Stone",
		"type": "member"
	},
	{
		"name": "Mark Strand",
		"type": "member"
	},
	{
		"name": "Dabney Stuart",
		"type": "member"
	},
	{
		"name": "Gary Sullivan",
		"type": "member"
	},
	{
		"name": "Barton Sutter",
		"type": "member"
	},
	{
		"name": "Brian Swann",
		"type": "member"
	},
	{
		"name": "Cole Swensen",
		"type": "member"
	},
	{
		"name": "May Swenson",
		"type": "member"
	},
	{
		"name": "Joan Swift",
		"type": "member"
	},
	{
		"name": "Janet Sylvester",
		"type": "member"
	},
	{
		"name": "John Taggart",
		"type": "member"
	},
	{
		"name": "Nathaniel Tarn",
		"type": "member"
	},
	{
		"name": "James Tate",
		"type": "member"
	},
	{
		"name": "Henry Taylor",
		"type": "member"
	},
	{
		"name": "Brian Teare",
		"type": "member"
	},
	{
		"name": "Roberto Tejada",
		"type": "member"
	},
	{
		"name": "Fiona Templeton",
		"type": "member"
	},
	{
		"name": "Lorenzo Thomas",
		"type": "member"
	},
	{
		"name": "Susan Tichy",
		"type": "member"
	},
	{
		"name": "Richard Tillinghast",
		"type": "member"
	},
	{
		"name": "Charles Tomlinson",
		"type": "member"
	},
	{
		"name": "Edwin Torres",
		"type": "member"
	},
	{
		"name": "Rodrigo Toscano",
		"type": "member"
	},
	{
		"name": "Tony Towle",
		"type": "member"
	},
	{
		"name": "Wesley Trimpi",
		"type": "member"
	},
	{
		"name": "Quincy Troupe",
		"type": "member"
	},
	{
		"name": "Lewis Turco",
		"type": "member"
	},
	{
		"name": "Frederick Turner",
		"type": "member"
	},
	{
		"name": "Chase Twichell",
		"type": "member"
	},
	{
		"name": "Tristan Tzara",
		"type": "member"
	},
	{
		"name": "John Updike",
		"type": "member"
	},
	{
		"name": "Jean Valentine",
		"type": "member"
	},
	{
		"name": "Mona Van Duyn",
		"type": "member"
	},
	{
		"name": "Cecilia Vicuña",
		"type": "member"
	},
	{
		"name": "Peter Viereck",
		"type": "member"
	},
	{
		"name": "Alma Luz Villanueva",
		"type": "member"
	},
	{
		"name": "Paul Violi",
		"type": "member"
	},
	{
		"name": "Ellen Bryant Voigt",
		"type": "member"
	},
	{
		"name": "Arthur Vogelsang",
		"type": "member"
	},
	{
		"name": "Paul de Vree",
		"type": "member"
	},
	{
		"name": "David Wagoner",
		"type": "member"
	},
	{
		"name": "Diane Wakoski",
		"type": "member"
	},
	{
		"name": "Derek Walcott",
		"type": "member"
	},
	{
		"name": "Anne Waldman",
		"type": "member"
	},
	{
		"name": "G. C. Waldrep",
		"type": "member"
	},
	{
		"name": "Keith Waldrop",
		"type": "member"
	},
	{
		"name": "Rosmarie Waldrop",
		"type": "member"
	},
	{
		"name": "Alice Walker",
		"type": "member"
	},
	{
		"name": "Ronald Wallace",
		"type": "member"
	},
	{
		"name": "Marilyn N. Waniek",
		"type": "member"
	},
	{
		"name": "Diane Ward",
		"type": "member"
	},
	{
		"name": "Candice Warne",
		"type": "member"
	},
	{
		"name": "Robert Penn Warren",
		"type": "member"
	},
	{
		"name": "Rosanna Warren",
		"type": "member"
	},
	{
		"name": "Lewis Warsh",
		"type": "member"
	},
	{
		"name": "Michael Waters",
		"type": "member"
	},
	{
		"name": "Barrett Watten",
		"type": "member"
	},
	{
		"name": "Tom Weatherly",
		"type": "member"
	},
	{
		"name": "Roger Weingarten",
		"type": "member"
	},
	{
		"name": "Bruce Weigl",
		"type": "member"
	},
	{
		"name": "Hannah Weiner",
		"type": "member"
	},
	{
		"name": "James Welch",
		"type": "member"
	},
	{
		"name": "Lew Welch",
		"type": "member"
	},
	{
		"name": "Marjorie Welish",
		"type": "member"
	},
	{
		"name": "Mac Wellman",
		"type": "member"
	},
	{
		"name": "Darren Wershler",
		"type": "member"
	},
	{
		"name": "Kathleene West",
		"type": "member"
	},
	{
		"name": "Mildred Weston",
		"type": "member"
	},
	{
		"name": "Rachel Wetzsteon",
		"type": "member"
	},
	{
		"name": "Philip Whalen",
		"type": "member"
	},
	{
		"name": "Gail White",
		"type": "member"
	},
	{
		"name": "Jon Manchip White",
		"type": "member"
	},
	{
		"name": "James Whitehead",
		"type": "member"
	},
	{
		"name": "Carolyn B. Whitlow",
		"type": "member"
	},
	{
		"name": "Ruth Whitman",
		"type": "member"
	},
	{
		"name": "Reed Whittemore",
		"type": "member"
	},
	{
		"name": "John Wieners",
		"type": "member"
	},
	{
		"name": "Dara Wier",
		"type": "member"
	},
	{
		"name": "Richard Wilbur",
		"type": "member"
	},
	{
		"name": "Peter Wild",
		"type": "member"
	},
	{
		"name": "Joshua Marie Wilkinson",
		"type": "member"
	},
	{
		"name": "Nancy Willard",
		"type": "member"
	},
	{
		"name": "C. K. Williams",
		"type": "member"
	},
	{
		"name": "Emmett Williams",
		"type": "member"
	},
	{
		"name": "John A. Williams",
		"type": "member"
	},
	{
		"name": "Jonathan Williams",
		"type": "member"
	},
	{
		"name": "Lisa Williams",
		"type": "member"
	},
	{
		"name": "Miller Williams",
		"type": "member"
	},
	{
		"name": "William Carlos Williams",
		"type": "member"
	},
	{
		"name": "Greg Williamson",
		"type": "member"
	},
	{
		"name": "Elizabeth Willis",
		"type": "member"
	},
	{
		"name": "Sara Wintz",
		"type": "member"
	},
	{
		"name": "Harold Witt",
		"type": "member"
	},
	{
		"name": "David Wojahn",
		"type": "member"
	},
	{
		"name": "Daniel Wolff",
		"type": "member"
	},
	{
		"name": "Nellie Wong",
		"type": "member"
	},
	{
		"name": "Baron Wormser",
		"type": "member"
	},
	{
		"name": "C. D. Wright",
		"type": "member"
	},
	{
		"name": "Celeste T. Wright",
		"type": "member"
	},
	{
		"name": "Charles Wright",
		"type": "member"
	},
	{
		"name": "James Wright",
		"type": "member"
	},
	{
		"name": "Jay Wright",
		"type": "member"
	},
	{
		"name": "Mark Wunderlich",
		"type": "member"
	},
	{
		"name": "John Yau",
		"type": "member"
	},
	{
		"name": "William Butler Yeats",
		"type": "member"
	},
	{
		"name": "Monica Youn",
		"type": "member"
	},
	{
		"name": "Al Young",
		"type": "member"
	},
	{
		"name": "David Young",
		"type": "member"
	},
	{
		"name": "Dean Young",
		"type": "member"
	},
	{
		"name": "Kevin Young",
		"type": "member"
	},
	{
		"name": "La Monte Young",
		"type": "member"
	},
	{
		"name": "Matthew Zapruder",
		"type": "member"
	},
	{
		"name": "Andrew Zawacki",
		"type": "member"
	},
	{
		"name": "Lisa Zeidner",
		"type": "member"
	},
	{
		"name": "Paul Zimmer",
		"type": "member"
	},
	{
		"name": "Rachel Zucker",
		"type": "member"
	},
	{
		"name": "Louis Zukofsky",
		"type": "member"
	},
	{
		"name": "UbuWeb",
		"type": "Institution"
	},
	{
		"name": "PennSound",
		"type": "Institution"
	},
	{
		"name": "voca",
		"type": "Institution"
	},
	{
		"name": "Smith_The Morrow Anthology_1985",
		"type": "Institution"
	},
	{
		"name": "Halpern_The New Poetry Anthology_1975",
		"type": "Institution"
	},
	{
		"name": "Finch_A Formal Feeling Comes_1994",
		"type": "Institution"
	},
	{
		"name": "Jarman_Rebel Angels_1996",
		"type": "Institution"
	},
	{
		"name": "Elliston",
		"type": "Institution"
	},
	{
		"name": "Hall_New Poets of England and America_1957",
		"type": "Institution"
	},
	{
		"name": "McClatchy_Contemporary American Poetry_1990",
		"type": "Institution"
	},
	{
		"name": "Vendler_Contemporary American Poetry_1985",
		"type": "Institution"
	},
	{
		"name": "Dacey_Strong Measures_1986",
		"type": "Institution"
	},
	{
		"name": "Ciardi_Mid-Century American Poets_1950",
		"type": "Institution"
	},
	{
		"name": "Elliott_Fifteen Modern American Poets_1956",
		"type": "Institution"
	}
]

links_data = [
	{
		"source": "Vito Acconci",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Kathy Acker",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Kathy Acker",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Diane Ackerman",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Diane Ackerman",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Helen Adam",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Etel Adnan",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Ai",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Ai",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Ai",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Rosa Alcalá",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Elizabeth Alexander",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Elizabeth Alexander",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Elizabeth Alexander",
		"target": "Jarman_Rebel Angels_1996",
		"weight": "1"
	},
	{
		"source": "Will Alexander",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Sherman Alexie",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Agha Shahid Ali",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Dick Allen",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Nell Altizer",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Julia Alvarez",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Julia Alvarez",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Julia Alvarez",
		"target": "Jarman_Rebel Angels_1996",
		"weight": "1"
	},
	{
		"source": "Kingsley Amis",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "A. R. Ammons",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "A. R. Ammons",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Daniel Anderson",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Jon Anderson",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Jon Anderson",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Jon Anderson",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Jon Anderson",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Bruce Andrews",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "David Antin",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "David Antin",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Louis Aragon",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Rae Armantrout",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Rae Armantrout",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "John Ashbery",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "John Ashbery",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "John Ashbery",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "John Ashbery",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "John Ashbery",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "John Ashbery",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "John Ashbery",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Jimmy Santiago Baca",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "David Baker",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "David Baker",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "David Baker",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "David Baker",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Peter Balakian",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Mary Jo Bang",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Amiri Baraka (LeRoi Jones)",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Amiri Baraka (LeRoi Jones)",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Judith Barrington",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Judith Barrington",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Bruce Bawer",
		"target": "Jarman_Rebel Angels_1996",
		"weight": "1"
	},
	{
		"source": "Dan Beachy-Quick",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Ray A. Young Bear",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Paul Beatty",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Joshua Beckman",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Samuel Beckett",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Cal Bedient",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Josh Bell",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Marvin Bell",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Marvin Bell",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Marvin Bell",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Marvin Bell",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "William Bell",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Dodie Bellamy",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Martine Bellen",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Molly Bendall",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Michael Benedikt",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Michael Benedikt",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Michael Benedikt",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Bruce Bennett",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Louise Bennett",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "John Bensko",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Steve Benson",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Caroline Bergvall",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Caroline Bergvall",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Caroline Bergvall",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Bill Berkson",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Alan Bernheimer",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Charles Bernstein",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Charles Bernstein",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Charles Bernstein",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Ted Berrigan",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Ted Berrigan",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "John Berryman",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "John Berryman",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "John Berryman",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "John Berryman",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Mei-mei Berssenbrugge",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Mei-mei Berssenbrugge",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "James Bertram",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Jen Bervin",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Jen Bervin",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Frank Bidart",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Frank Bidart",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Frank Bidart",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Frank Bidart",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Elizabeth Bishop",
		"target": "Ciardi_Mid-Century American Poets_1950",
		"weight": "1"
	},
	{
		"source": "Elizabeth Bishop",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Elizabeth Bishop",
		"target": "Elliott_Fifteen Modern American Poets_1956",
		"weight": "1"
	},
	{
		"source": "Elizabeth Bishop",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Elizabeth Bishop",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Sherwin Bitsui",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Paul Blackburn",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Brian Blanchfield",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Robin Blaser",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Chana Bloch",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Ron Block",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Michael Blumenthal",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Michael Blumenthal",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Robert Bly",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Robert Bly",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Robert Bly",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Louise Bogan",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Christian Bök",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Christian Bök",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Christian Bök",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Eavan Boland",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Philip Booth",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Philip Booth",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Daniel Borzutzky",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "David Bottoms",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Anne Boyer",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Edgar Bowers",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Edgar Bowers",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Kamau Brathwaite",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "George Brecht",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "John Bricuth",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Van K. Brock",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Jim Brodey",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "William Bronk",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "William Bronk",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Gwendolyn Brooks",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Nicole Brossard",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Lee Ann Brown",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Lee Ann Brown",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Rosellen Brown",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Rosellen Brown",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Sterling A. Brown",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Laynie Browne",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Laynie Browne",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Michael Dennis Browne",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Michael Dennis Browne",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Michael Dennis Browne",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Michael Brownstein",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Debra Bruce",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Sharon Bryan",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Julia Budenz",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Charles Bukowski",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Michael Burkard",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Michael Burkard",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Stanley Burnshaw",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "William S. Burroughs",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "David Buuck",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "John Cage",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Rafael Campo",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Rafael Campo",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Rafael Campo",
		"target": "Jarman_Rebel Angels_1996",
		"weight": "1"
	},
	{
		"source": "Augusto de Campos",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Haroldo de Campos",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Melissa Cannon",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Henri Chopin",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Nick Carbó",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Henry Carlile",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Henry Carlile",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Julie Carr",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Julie Carr",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Hayden Carruth",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Hayden Carruth",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Turner Cassity",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Turner Cassity",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Charles Causley",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Joseph Ceravolo",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Joseph Ceravolo",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Lorna Dee Cervantes",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Fred Chappell",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Maxine Chernoff",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Maxine Chernoff",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Kelly Cherry",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Kelly Cherry",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Abigail Child",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Marilyn Chin",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Nicholas Christopher",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "John Ciardi",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "John Ciardi",
		"target": "Ciardi_Mid-Century American Poets_1950",
		"weight": "1"
	},
	{
		"source": "John Ciardi",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Sandra Cisneros",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Sandra Cisneros",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Amy Clampitt",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Amy Clampitt",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Amy Clampitt",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Amy Clampitt",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Cheryl Clarke",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Carlfriedrich Claus",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Lucille Clifton",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Lucille Clifton",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Claude Closky",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Joshua Clover",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Joshua Clover",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Bob Cobbing",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Henri Cole",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Norma Cole",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Wanda Coleman",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Wanda Coleman",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Martha Collins",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Martha Collins",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Conyus",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Peter Cooley",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Peter Cooley",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Peter Cooley",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Peter Cooley",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Clark Coolidge",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Clark Coolidge",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Dennis Cooper",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Jane Cooper",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Jane Cooper",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "William Corbett",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Martin Corless-Smith",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Cid Corman",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Cid Corman",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Alfred Corn",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Alfred Corn",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Alfred Corn",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Alfred Corn",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Gregory Corso",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Gregory Corso",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Jayne Cortez",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Gerald Costanzo",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Gerald Costanzo",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Henri Coulette",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Hart Crane",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Robert Creeley",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Robert Creeley",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Robert Creeley",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Robert Creeley",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Robert Creeley",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Robert Creeley",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Victor Hernández Cruz",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "J. V. Cunningham",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "J. V. Cunningham",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Philip Dacey",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Philip Dacey",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Beverly Dahlen",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Beverly Dahlen",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Maria Damon",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Tina Darragh",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Glover David",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Michael Davidson",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Donald Davie",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Donald Davie",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Alan Davies",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Catherine Davis",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Catherine Davis",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Jordan Davis",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Lydia Davis",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Lydia Davis",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Olena Kalytiak Davis",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Peter Davison",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Peter Davison",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Jean Day",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Walter De Maria",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Mónica de la Torre",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Mónica de la Torre",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Edwin Denby",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Jeff Derksen",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Toi Derricotte",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Babette Deutsch",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Thomas Devaney",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Christopher Dewdney",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "W. S. Di Piero",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "W. S. Di Piero",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "James Dickey",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "James Dickey",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "James Dickey",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Emily Dickinson",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Linh Dinh",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Ray DiPalma",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Thomas M. Disch",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Thomas M. Disch",
		"target": "Jarman_Rebel Angels_1996",
		"weight": "1"
	},
	{
		"source": "Marcel Duchamp",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Stephen Dobyns",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Stephen Dobyns",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Owen Dodson",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Timothy Donnelly",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Stacy Doris",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Edward Dorn",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Edward Dorn",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Edward Dorn",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Mark Doty",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Mark Doty",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Keith Douglas",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Rita Dove",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Rita Dove",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Rita Dove",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Rita Dove",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Rita Dove",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Rita Dove",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Rita Dove",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Philip Dow",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Suzanne J. Doyle",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Lynne Dreyer",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Johanna Drucker",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Norman Dubie",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Norman Dubie",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Norman Dubie",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Alan Dugan",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Alan Dugan",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Denise Duhamel",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Robert Duncan",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Robert Duncan",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Robert Duncan",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Stephen Dunn",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Stephen Dunn",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Stephen Dunn",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Stephen Dunn",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Rachel Blau DuPlessis",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Craig Dworkin",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Craig Dworkin",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Bob Dylan",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Richard Eberhart",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Richard Eberhart",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Richard Eberhart",
		"target": "Ciardi_Mid-Century American Poets_1950",
		"weight": "1"
	},
	{
		"source": "Richard Eberhart",
		"target": "Elliott_Fifteen Modern American Poets_1956",
		"weight": "1"
	},
	{
		"source": "Russell Edson",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Russell Edson",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Gretel Ehrlich",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Gretel Ehrlich",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Larry Eigner",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Thomas Sayers Ellis",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Thomas Sayers Ellis",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Kenward Elmslie",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Laura Elrick",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Lynn Emanuel",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Lynn Emanuel",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Lynn Emanuel",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "John Engels",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Daniel Mark Epstein",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Elaine Equi",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Clayton Eshleman",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Clayton Eshleman",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Martín Espada",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Rhina P. Espaillat",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "George Evans",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Peter Everwine",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Dan Farrell",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Julie Fay",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Frederick Feirstein",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Frederick Feirstein",
		"target": "Jarman_Rebel Angels_1996",
		"weight": "1"
	},
	{
		"source": "Irving Feldman",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Susan Feldman",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Lawrence Ferlinghetti",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Lawrence Ferlinghetti",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Edward Field",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Edward Field",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Annie Finch",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Annie Finch",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Donald Finkel",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Robert Fitterman",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Robert Fitterman",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Nick Flynn",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Calvin Forbes",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Carolyn Forché",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Carolyn Forché",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Carolyn Forché",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Carolyn Forché",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Kathleen Fraser",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Kathleen Fraser",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Kathleen Fraser",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Benjamin Friedlander",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Carol Frost",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Joanna Fuhrman",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Heather Fuller",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Alice Fulton",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Alice Fulton",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Christopher Funkhouser",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Tess Gallagher",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Tess Gallagher",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Tess Gallagher",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Tess Gallagher",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "James Galvin",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Forrest Gander",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Forrest Gander",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Suzanne Gardinier",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Drew Gardner",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Isabella Gardner",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Ilse Garnier",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Pierre Garnier",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "George Garrett",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "George Garrett",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "George Garrett",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Jean Garrigue",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Joan Austin Geier",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Susan Gevirtz",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Reginald Gibbons",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Reginald Gibbons",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Margaret Gibson",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Lawrence Giffin",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Christopher Gilbert",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Gary Gildner",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Gary Gildner",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Carmen Giménez Smith",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Madeline Gins",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Allen Ginsberg",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Allen Ginsberg",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Allen Ginsberg",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Allen Ginsberg",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Allen Ginsberg",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Allen Ginsberg",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Allen Ginsberg",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Dana Gioia",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Dana Gioia",
		"target": "Jarman_Rebel Angels_1996",
		"weight": "1"
	},
	{
		"source": "John Giorno",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "John Giorno",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Nikki Giovanni",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Nikki Giovanni",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "C. S. Giscombe",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "C. S. Giscombe",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Peter Gizzi",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Louise Glück",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Louise Glück",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Louise Glück",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Louise Glück",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Louise Glück",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Louise Glück",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Louise Glück",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "John Godfrey",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Patricia Goedicke",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Albert Goldbarth",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Albert Goldbarth",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Albert Goldbarth",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Albert Goldbarth",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Albert Goldbarth",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Albert Goldbarth",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Judith Goldman",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Judith Goldman",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Kenneth Goldsmith",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Kenneth Goldsmith",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Kenneth Goldsmith",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Eugen Gomringer",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Rigoberto González",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Nada Gordon",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Sarah Gorham",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Michael Gottlieb",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Dan Graham",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Jorie Graham",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Jorie Graham",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Jorie Graham",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Jorie Graham",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Jorie Graham",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "K. Lorraine Graham",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "W. S. Graham",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Barbara L. Greenberg",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Ted Greenwald",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Jane Greer",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Debora Greger",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Linda Gregg",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Linda Gregg",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Linda Gregg",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Linda Gregg",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Robert Grenier",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Emily Grosholz",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Emily Grosholz",
		"target": "Jarman_Rebel Angels_1996",
		"weight": "1"
	},
	{
		"source": "Barbara Guest",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Charles Gullans",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Thom Gunn",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Thom Gunn",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Thom Gunn",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "R. S. Gwynn",
		"target": "Jarman_Rebel Angels_1996",
		"weight": "1"
	},
	{
		"source": "Brion Gysin",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "H.D.",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Marilyn Hacker",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Marilyn Hacker",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Marilyn Hacker",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Marilyn Hacker",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Marilyn Hacker",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Marilyn Hacker",
		"target": "Jarman_Rebel Angels_1996",
		"weight": "1"
	},
	{
		"source": "Marilyn Hacker",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Marilyn Hacker",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Rachel Hadas",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Rachel Hadas",
		"target": "Jarman_Rebel Angels_1996",
		"weight": "1"
	},
	{
		"source": "Kimiko Hahn",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Donald Hall",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Donald Hall",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Donald Hall",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Donald Hall",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Donald Hall",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Mark Halperin",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Mark Halperin",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Daniel Halpern",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Daniel Halpern",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Daniel Halpern",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Michael Hamburger",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Al Hansen",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Joy Harjo",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Edward Harkness",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Michael S. Harper",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Michael S. Harper",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Michael S. Harper",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Michael S. Harper",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Michael S. Harper",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "William J. Harris",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Jim Harrison",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Jim Harrison",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Elizabeth B. Harrod",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Carla Harryman",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Charles O. Hartman",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Matthea Harvey",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Robert Hass",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Robert Hass",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Robert Hass",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Robert Hass",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "William Hathaway",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "William Hathaway",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Vaclav Havel",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Robert Hayden",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Robert Hayden",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Robert Hayden",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Terrance Hayes",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Terrance Hayes",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Seamus Heaney",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Seamus Heaney",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "John Heath-Stubbs",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Anthony Hecht",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Anthony Hecht",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Anthony Hecht",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Allison Adelle Hedge Coke",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Michael Heffernan",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Lyn Hejinian",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Lyn Hejinian",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Judith Hemschemeyer",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "William Heyen",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "William Heyen",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "William Heyen",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Bob Hicok",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Dick Higgins",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Mitch Highfill",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Geoffrey Hill",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Brenda Hillman",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Brenda Hillman",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Edward Hirsch",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Edward Hirsch",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Edward Hirsch",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Åke Hodell",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Daniel Hoffman",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Daniel Hoffman",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Linda Hogan",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Jonathan Holden",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "John Hollander",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "John Hollander",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "John Hollander",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "John Hollander",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Anselm Hollo",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "John Holloway",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "John Holmes",
		"target": "Ciardi_Mid-Century American Poets_1950",
		"weight": "1"
	},
	{
		"source": "Cathy Park Hong",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Garrett Kaoru Hongo",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Garrett Kaoru Hongo",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Garrett Kaoru Hongo",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Paul Hoover",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "David Brendan Hopes",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Ben Howard",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Richard Howard",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Richard Howard",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Richard Howard",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Richard Howard",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Fanny Howe",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Fanny Howe",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Susan Howe",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Barbara Howes",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Andrew Hudgins",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Andrew Hudgins",
		"target": "Jarman_Rebel Angels_1996",
		"weight": "1"
	},
	{
		"source": "Yunte Huang",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Robert Huff",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Langston Hughes",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Richard Hugo",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Richard Hugo",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Richard Hugo",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Richard Hugo",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Christine Hume",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "T. R. Hummer",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "T. R. Hummer",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "T. R. Hummer",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Erica Hunt",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "David Ignatow",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "David Ignatow",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Lawson Fusao Inada",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Lawson Fusao Inada",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "P. Inman (Peter Inman)",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Kenneth Irby",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Josephine Jacobsen",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Josephine Jacobsen",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Peter Jaeger",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Elizabeth James",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Thomas James",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Thomas James",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Ernst Jandl",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Mark Jarman",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Lisa Jarnot",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Randall Jarrell",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Randall Jarrell",
		"target": "Ciardi_Mid-Century American Poets_1950",
		"weight": "1"
	},
	{
		"source": "Randall Jarrell",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Randall Jarrell",
		"target": "Elliott_Fifteen Modern American Poets_1956",
		"weight": "1"
	},
	{
		"source": "Randall Jarrell",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Randall Jarrell",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Elizabeth Jennings",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Laura Jensen",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Laura Jensen",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Judson Jerome",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Denis Johnson",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Denis Johnson",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Denis Johnson",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Don Johnson",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "James Weldon Johnson",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "\"Raymond Edward \"\"Ray\"\" Johnson\"",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Ronald Johnson",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Rodney Jones",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Rodney Jones",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Rodney Jones",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Erica Jong",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Erica Jong",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "A. Van Jordan",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "June Jordan",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "June Jordan",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Andrew Joron",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Andrew Joron",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Allison Joseph",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Donald Justice",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Donald Justice",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Donald Justice",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Donald Justice",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Donald Justice",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Ilya Kaminsky",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Bhanu Kapil",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Bhanu Kapil",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Laura Kasischke",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Joy Katz",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Ellen de Young Kay",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Richard Katrovas",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Richard Katrovas",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Claudia Keelan",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Greg Keeler",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Weldon Kees",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Lenore Keeshit-Tobias",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Robert Kelly",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Dolores Kendrick",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Dolores Kendrick",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "X. J. Kennedy",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "X. J. Kennedy",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "X. J. Kennedy",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Jane Kenyon",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Jack Kerouac",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Faye Kicknosway",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Myung Mi Kim",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Suji Kwock Kim",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Galway Kinnell",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Galway Kinnell",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Galway Kinnell",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Thomas Kinsella",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Mary Kinzie",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Carolyn Kizer",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Carolyn Kizer",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Carolyn Kizer",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Carolyn Kizer",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Peter Klappert",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Peter Klappert",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "August Kleinzahler",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Etheridge Knight",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Etheridge Knight",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Etheridge Knight",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Bill Knott (Saint Geraud)",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Bill Knott (Saint Geraud)",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Christopher Knowles",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Caroline Knox",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Kenneth Koch",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Kenneth Koch",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Kenneth Koch",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Rodney Koeneke",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Phyllis Koestenbaum",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Sybil Kollar",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Yusef Komunyakaa",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Yusef Komunyakaa",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Yusef Komunyakaa",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Yusef Komunyakaa",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Ted Kooser",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Ted Kooser",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Aaron Kramer",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Judith Kroll",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Judith Kroll",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Maxine Kumin",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Maxine Kumin",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Maxine Kumin",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Maxine Kumin",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Stanley Kunitz",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Greg Kuzma",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Greg Kuzma",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Joanne Kyger",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Melvin Walker La Follette",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Joan LaBombard",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Philip Lamantia",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Joseph Langland",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Joseph Langland",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Philip Larkin",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Paul Lake",
		"target": "Jarman_Rebel Angels_1996",
		"weight": "1"
	},
	{
		"source": "James Laughlin",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Ann Lauterbach",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Ann Lauterbach",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Robert Layzer",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Sydney Lea",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Sydney Lea",
		"target": "Jarman_Rebel Angels_1996",
		"weight": "1"
	},
	{
		"source": "Sydney Lea",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Joseph Lease",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Al Lee",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Al Lee",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Li-Young Lee",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Barbara Lefcowitz",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "David Lehman",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "David Lehman",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Leevi Lehto",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Brad Leithauser",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Brad Leithauser",
		"target": "Jarman_Rebel Angels_1996",
		"weight": "1"
	},
	{
		"source": "Brad Leithauser",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Ben Lerner",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Ben Lerner",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Rika Lesser",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Rika Lesser",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Denise Levertov",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Denise Levertov",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Denise Levertov",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Denise Levertov",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Dana Levin",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Dana Levin",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Phillis Levin",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Phillis Levin",
		"target": "Jarman_Rebel Angels_1996",
		"weight": "1"
	},
	{
		"source": "Philip Levine",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Philip Levine",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Philip Levine",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Philip Levine",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Fred Levinson",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Larry Levis",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Larry Levis",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Larry Levis",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Janet Lewis",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Elizabeth Libbey",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Elizabeth Libbey",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Elizabeth Libbey",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Tan Lin",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Tan Lin",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Timothy Liu",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "John Logan",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "John Logan",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "William Logan",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "William Logan",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "William Logan",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Arrigo Lora-Totino",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Audre Lorde",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Robert Lowell",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Robert Lowell",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Robert Lowell",
		"target": "Ciardi_Mid-Century American Poets_1950",
		"weight": "1"
	},
	{
		"source": "Robert Lowell",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Robert Lowell",
		"target": "Elliott_Fifteen Modern American Poets_1956",
		"weight": "1"
	},
	{
		"source": "Robert Lowell",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Robert Lowell",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Robert Lowell",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Susan Ludvigson",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Thomas Lux",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Thomas Lux",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Thomas Lux",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Thomas Lux",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Karen Mac Cormack",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Jackson Mac Low",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Jackson Mac Low",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Cynthia MacDonald",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Cynthia MacDonald",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Nathaniel Mackey",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Nathaniel Mackey",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Michael Magee",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Gerald Malanga",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Donato Mancini",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Tom Mandel",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Maurice Manning",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Paul Mariani",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Charles Martin",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Charles Martin",
		"target": "Jarman_Rebel Angels_1996",
		"weight": "1"
	},
	{
		"source": "Valerie Martínez",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "David Mason",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "William Matchett",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Harry Mathews",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Cleopatra Mathis",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Cleopatra Mathis",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Khaled Mattawa",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "William Matthews",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "William Matthews",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "William Matthews",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Bernadette Mayer",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Bernadette Mayer",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Hansjörg Mayer",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "E. L. Mayo",
		"target": "Ciardi_Mid-Century American Poets_1950",
		"weight": "1"
	},
	{
		"source": "Mekeel McBride",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Mekeel McBride",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Angela McCabe",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Steve McCaffery",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Steve McCaffery",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Michael McClure",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Howard McCord",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "David McElroy",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Thomas McGrath",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Thomas McGrath",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Medbh McGuckian",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Heather McHugh",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Heather McHugh",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Heather McHugh",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Heather McHugh",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Stephen McLaughlin",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "James McMichael",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Mark McMorris",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Sandra McPherson",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Sandra McPherson",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Sandra McPherson",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Sandra McPherson",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Sandra McPherson",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Sandra McPherson",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Joyelle McSweeney",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Peter Meinke",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "David Meltzer",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "William Meredith",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "William Meredith",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "William Meredith",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "James Merrill",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "James Merrill",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "James Merrill",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "James Merrill",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "James Merrill",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "W. S. Merwin",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "W. S. Merwin",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "W. S. Merwin",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "W. S. Merwin",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "W. S. Merwin",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "W. S. Merwin",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Sharon Mesmer",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Douglas Messerli",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Robert Mezey",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Robert Mezey",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Robert Mezey",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Robert Mezey",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Robert Mezey",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Josephine Miles",
		"target": "Elliott_Fifteen Modern American Poets_1956",
		"weight": "1"
	},
	{
		"source": "Edna St. Vincent Millay",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Jane Miller",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Jane Miller",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Vassar Miller",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Vassar Miller",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Vassar Miller",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Carol Mirakove",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Gary Miranda",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Judith Moffett",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "K. Silem Mohammad",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "N. Scott Momaday",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "N. Scott Momaday",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Franz Mon",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Paul Monette",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Leslie Monsour",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Honor Moore",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Richard Moore",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Cherríe Moraga",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Robert Morgan",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Robert Morgan",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Laura Moriarty",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Hilda Morley",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Tracie Morris",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Tracie Morris",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Tracie Morris",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Rusty Morrison",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Howard Moss",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Howard Moss",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Howard Moss",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Howard Moss",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Stanley Moss",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Fred Moten",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Fred Moten",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Erin Mouré",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Jennifer Moxley",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Lisel Mueller",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Paul Muldoon",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Harryette Mullen",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Laura Mullen",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Laura Mullen",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "G. E. Murray",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Les Murray",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Carol Muske-Dukes",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Carol Muske-Dukes",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Jack Myers",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Eileen Myles",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Maurizio Nannucci",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Melanie Neilson",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Melanie Neilson",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Maggie Nelson",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Marilyn Nelson",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Marilyn Nelson",
		"target": "Jarman_Rebel Angels_1996",
		"weight": "1"
	},
	{
		"source": "Howard Nemerov",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Howard Nemerov",
		"target": "Elliott_Fifteen Modern American Poets_1956",
		"weight": "1"
	},
	{
		"source": "Howard Nemerov",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Howard Nemerov",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Howard Nemerov",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "bpNichol (Barrie Phillip Nichol)",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "bpNichol (Barrie Phillip Nichol)",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Lorine Niedecker",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Seiichi Niikuni",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "John Frederick Nims",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "John Frederick Nims",
		"target": "Ciardi_Mid-Century American Poets_1950",
		"weight": "1"
	},
	{
		"source": "John Frederick Nims",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Suzanne Noguere",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Eiríkur Örn Norðdahl",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Eiríkur Örn Norðdahl",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Charles North",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Alice Notley",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Alice Notley",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Ladislav Novák",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Mark Nowak",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Naomi Shihab Nye",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Naomi Shihab Nye",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Naomi Shihab Nye",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Frank O'Hara",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Frank O'Hara",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Frank O'Hara",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Sharon Olds",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Sharon Olds",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Sharon Olds",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Carole Oles",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Mary Oliver",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Redell Olsen",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Charles Olson",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Charles Olson",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Yoko Ono",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "George Oppen",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Steve Orlen",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Steve Orlen",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Steve Orlen",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Gregory Orr",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Gregory Orr",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Gregory Orr",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Gregory Orr",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Simon J. Ortiz",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Simon J. Ortiz",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Maggie O'Sullivan",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Maureen Owen",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Rochelle Owens",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Robert Pack",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Robert Pack",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Robert Pack",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Ron Padgett",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Nam June Paik",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Grace Paley",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Michael Palmer",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Michael Palmer",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Michael Palmer",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Greg Pape",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Greg Pape",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Greg Pape",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Jay Parini",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Elsie Paschen",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Linda Pastan",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Linda Pastan",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Kenneth Patchen",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Julie Patton",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Julie Patton",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Molly Peacock",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Molly Peacock",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Molly Peacock",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Molly Peacock",
		"target": "Jarman_Rebel Angels_1996",
		"weight": "1"
	},
	{
		"source": "Molly Peacock",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "John Peck",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "John Peck",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Georges Perec",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Bob Perelman",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Bob Perelman",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Craig Santos Perez",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Craig Santos Perez",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "John Perreault",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Michael Pettit",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "M. Nourbese Philip",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Marge Piercy",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Helen Pinkerton",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Robert Pinsky",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Robert Pinsky",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Robert Pinsky",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Robert Pinsky",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Robert Pinsky",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Robert Pinsky",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Nick Piombino",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Vanessa Place",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Vanessa Place",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Sylvia Plath",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Sylvia Plath",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Sylvia Plath",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Stanley Plumly",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Stanley Plumly",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Hyam Plutzik",
		"target": "Elliott_Fifteen Modern American Poets_1956",
		"weight": "1"
	},
	{
		"source": "Katha Pollitt",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Katha Pollitt",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Katha Pollitt",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Bern Porter",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Ezra Pound",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Ezra Pound",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "D. A. Powell",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Larry Price",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Wyatt Prunty",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Wyatt Prunty",
		"target": "Jarman_Rebel Angels_1996",
		"weight": "1"
	},
	{
		"source": "Raymond Queneau",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Lawrence Raab",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Lawrence Raab",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Thomas Rabbitt",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Carl Rakosi",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "A. K. Ramanujan",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Bin Ramke",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Dudley Randall",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Paula Rankin",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Claudia Rankine",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Claudia Rankine",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Stephen Ratcliffe",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Tom Raworth",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "David Ray",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "David Ray",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Srikanth Reddy",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Ishmael Reed",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Ishmael Reed",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Alastair Reid",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Alastair Reid",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Ariana Reines",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Ariana Reines",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "James Reiss",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "James Reiss",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Naomi Replansky",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Joan Retallack",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Donald Revell",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Donald Revell",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Charles Reznikoff",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Adrienne Rich",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Adrienne Rich",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Adrienne Rich",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Adrienne Rich",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Adrienne Rich",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Adrienne Rich",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Adrienne Rich",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Deborah Richards",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "John Ridland",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Alberto Álvaro Ríos",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Alberto Álvaro Ríos",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Alberto Álvaro Ríos",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Ed Roberson",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Lisa Robertson",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Elizabeth Robinson",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Kit Robinson",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Stephen Rodefer",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Theodore Roethke",
		"target": "Ciardi_Mid-Century American Poets_1950",
		"weight": "1"
	},
	{
		"source": "Theodore Roethke",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Theodore Roethke",
		"target": "Elliott_Fifteen Modern American Poets_1956",
		"weight": "1"
	},
	{
		"source": "Theodore Roethke",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Theodore Roethke",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Pattiann Rogers",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Pattiann Rogers",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Matthew Rohrer",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "William Pitt Root",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "William Pitt Root",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "William Pitt Root",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Raymond Roseliep",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Kenneth Rosen",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Michael J. Rosen",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Kim Rosenfield",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Dieter Roth",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Jerome Rothenberg",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Jerome Rothenberg",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Jerome Rothenberg",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Gibbons Ruark",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Gibbons Ruark",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Mary Ruefle",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Mary Ruefle",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Gerhard Rühm",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Muriel Rukeyser",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Muriel Rukeyser",
		"target": "Ciardi_Mid-Century American Poets_1950",
		"weight": "1"
	},
	{
		"source": "Muriel Rukeyser",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Muriel Rukeyser",
		"target": "Elliott_Fifteen Modern American Poets_1956",
		"weight": "1"
	},
	{
		"source": "Michael Ryan",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Michael Ryan",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Michael Ryan",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Michael Ryan",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Michael Ryan",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Ira Sadoff",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Ira Sadoff",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Mary Jo Salter",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Mary Jo Salter",
		"target": "Jarman_Rebel Angels_1996",
		"weight": "1"
	},
	{
		"source": "Lisa Samuels",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Sonia Sanchez",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Sonia Sanchez",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Kaia Sand",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Sherod Santos",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Sherod Santos",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Sherod Santos",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Aram Saroyan",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "May Sarton",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "May Sarton",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Leslie Scalapino",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Leslie Scalapino",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Susan Fromberg Schaeffer",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Roy Scheele",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "James Schevill",
		"target": "Elliott_Fifteen Modern American Poets_1956",
		"weight": "1"
	},
	{
		"source": "Dennis Schmitz",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Gjertrud Schnackenberg",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Gjertrud Schnackenberg",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Gjertrud Schnackenberg",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Philip Schultz",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Philip Schultz",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Susan M. Schultz",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "James Schuyler",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "James Schuyler",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Delmore Schwartz",
		"target": "Ciardi_Mid-Century American Poets_1950",
		"weight": "1"
	},
	{
		"source": "Delmore Schwartz",
		"target": "Elliott_Fifteen Modern American Poets_1956",
		"weight": "1"
	},
	{
		"source": "Gail Scott",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Winfield Townley Scott",
		"target": "Ciardi_Mid-Century American Poets_1950",
		"weight": "1"
	},
	{
		"source": "Winfield Townley Scott",
		"target": "Elliott_Fifteen Modern American Poets_1956",
		"weight": "1"
	},
	{
		"source": "Maureen Seaton",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Peter Seaton",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Hugh Seidman",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Anne Sexton",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Anne Sexton",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Anne Sexton",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Alan Shapiro",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Alan Shapiro",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "David Shapiro",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Karl Shapiro",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Karl Shapiro",
		"target": "Ciardi_Mid-Century American Poets_1950",
		"weight": "1"
	},
	{
		"source": "Karl Shapiro",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Karl Shapiro",
		"target": "Elliott_Fifteen Modern American Poets_1956",
		"weight": "1"
	},
	{
		"source": "Brenda Shaughnessy",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Brenda Shaughnessy",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "James Sherry",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Judith Johnson Sherwin",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Aaron Shurin",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Eleni Sikelianos",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Eleni Sikelianos",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Richard Siken",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Jon Silkin",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Jon Silkin",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Jon Silkin",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Leslie Marmon Silko",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Ron Silliman",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Ron Silliman",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Charles Simic",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Charles Simic",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Charles Simic",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Charles Simic",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Charles Simic",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Charles Simic",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Maurya Simon",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Leslie Simon",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Louis Simpson",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Louis Simpson",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Louis Simpson",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "L. E. Sissman",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Knute Skinner",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Floyd Skloot",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "David R. Slavitt",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Patricia Smith",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Dave Smith",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Dave Smith",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Dave Smith",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Dave Smith",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Dave Smith",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Dave Smith",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Rod Smith",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Tracy K. Smith",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "William Jay Smith",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "W. D. Snodgrass",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "W. D. Snodgrass",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "W. D. Snodgrass",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "W. D. Snodgrass",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "W. D. Snodgrass",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Gary Snyder",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Gary Snyder",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Gary Snyder",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Gary Snyder",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Gary Snyder",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Gustaf Sobin",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Cathy Song",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Gary Soto",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Gary Soto",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Gary Soto",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Marcia Southwick",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Marcia Southwick",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Barry Spacks",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Juliana Spahr",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Juliana Spahr",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Adriano Spatola",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Roberta Spear",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Roberta Spear",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Jack Spicer",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Jack Spicer",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Elizabeth Spires",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Elizabeth Spires",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Elizabeth Spires",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Kathleen Spivack",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "David St. John",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "David St. John",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "David St. John",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "David St. John",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "William Stafford",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "William Stafford",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "William Stafford",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Maura Stanton",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Maura Stanton",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Maura Stanton",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Maura Stanton",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Maura Stanton",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Maura Stanton",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "George Starbuck",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Timothy Steele",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Timothy Steele",
		"target": "Jarman_Rebel Angels_1996",
		"weight": "1"
	},
	{
		"source": "Brian Kim Stefans",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Gertrude Stein",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Barry Sternlieb",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Wallace Stevens",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Wallace Stevens",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Anne Stevenson",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Susan Stewart",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Terry Stokes",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Terry Stokes",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Leon Stokesbury",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Leon Stokesbury",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Patricia Storace",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Ruth Stone",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Mark Strand",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Mark Strand",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Mark Strand",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Mark Strand",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Mark Strand",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Dabney Stuart",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Gary Sullivan",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Barton Sutter",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Brian Swann",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Cole Swensen",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Cole Swensen",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "May Swenson",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "May Swenson",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "May Swenson",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "May Swenson",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Joan Swift",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Janet Sylvester",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "John Taggart",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Nathaniel Tarn",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "James Tate",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "James Tate",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "James Tate",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "James Tate",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "James Tate",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Henry Taylor",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Henry Taylor",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Brian Teare",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Brian Teare",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Roberto Tejada",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Fiona Templeton",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Lorenzo Thomas",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Susan Tichy",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Richard Tillinghast",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Richard Tillinghast",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Charles Tomlinson",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Edwin Torres",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Edwin Torres",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Rodrigo Toscano",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Rodrigo Toscano",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Tony Towle",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Wesley Trimpi",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Quincy Troupe",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Lewis Turco",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Frederick Turner",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Frederick Turner",
		"target": "Jarman_Rebel Angels_1996",
		"weight": "1"
	},
	{
		"source": "Chase Twichell",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Chase Twichell",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Tristan Tzara",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "John Updike",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Jean Valentine",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Jean Valentine",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Mona Van Duyn",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Mona Van Duyn",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Mona Van Duyn",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Mona Van Duyn",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Cecilia Vicuña",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Cecilia Vicuña",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Peter Viereck",
		"target": "Ciardi_Mid-Century American Poets_1950",
		"weight": "1"
	},
	{
		"source": "Alma Luz Villanueva",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Paul Violi",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Ellen Bryant Voigt",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Ellen Bryant Voigt",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Ellen Bryant Voigt",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Ellen Bryant Voigt",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Arthur Vogelsang",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Paul de Vree",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "David Wagoner",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "David Wagoner",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "David Wagoner",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "David Wagoner",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Diane Wakoski",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Diane Wakoski",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Diane Wakoski",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Diane Wakoski",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Derek Walcott",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Anne Waldman",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Anne Waldman",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Anne Waldman",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Anne Waldman",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "G. C. Waldrep",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Keith Waldrop",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Keith Waldrop",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Rosmarie Waldrop",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Rosmarie Waldrop",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Alice Walker",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Ronald Wallace",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Marilyn N. Waniek",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Marilyn N. Waniek",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Diane Ward",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Candice Warne",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Robert Penn Warren",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Robert Penn Warren",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Robert Penn Warren",
		"target": "Elliott_Fifteen Modern American Poets_1956",
		"weight": "1"
	},
	{
		"source": "Robert Penn Warren",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Rosanna Warren",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Rosanna Warren",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Lewis Warsh",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Lewis Warsh",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Michael Waters",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Michael Waters",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Barrett Watten",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Tom Weatherly",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Roger Weingarten",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Roger Weingarten",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Roger Weingarten",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Bruce Weigl",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Hannah Weiner",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Hannah Weiner",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "James Welch",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "James Welch",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Lew Welch",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Marjorie Welish",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Mac Wellman",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Darren Wershler",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Kathleene West",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Mildred Weston",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Rachel Wetzsteon",
		"target": "Jarman_Rebel Angels_1996",
		"weight": "1"
	},
	{
		"source": "Philip Whalen",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Gail White",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Jon Manchip White",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "James Whitehead",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Carolyn B. Whitlow",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Ruth Whitman",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Reed Whittemore",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Reed Whittemore",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "John Wieners",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Dara Wier",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Richard Wilbur",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Richard Wilbur",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Richard Wilbur",
		"target": "Ciardi_Mid-Century American Poets_1950",
		"weight": "1"
	},
	{
		"source": "Richard Wilbur",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Richard Wilbur",
		"target": "Elliott_Fifteen Modern American Poets_1956",
		"weight": "1"
	},
	{
		"source": "Richard Wilbur",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "Richard Wilbur",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Richard Wilbur",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Peter Wild",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Peter Wild",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Joshua Marie Wilkinson",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Nancy Willard",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "C. K. Williams",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "C. K. Williams",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "C. K. Williams",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "C. K. Williams",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Emmett Williams",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "John A. Williams",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Jonathan Williams",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Lisa Williams",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Miller Williams",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "William Carlos Williams",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "William Carlos Williams",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Greg Williamson",
		"target": "Jarman_Rebel Angels_1996",
		"weight": "1"
	},
	{
		"source": "Elizabeth Willis",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Sara Wintz",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Harold Witt",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "David Wojahn",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "David Wojahn",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "David Wojahn",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "Daniel Wolff",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Nellie Wong",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Baron Wormser",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Baron Wormser",
		"target": "Smith_The Morrow Anthology_1985",
		"weight": "1"
	},
	{
		"source": "C. D. Wright",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "C. D. Wright",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "C. D. Wright",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Celeste T. Wright",
		"target": "Finch_A Formal Feeling Comes_1994",
		"weight": "1"
	},
	{
		"source": "Charles Wright",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Charles Wright",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Charles Wright",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Charles Wright",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Charles Wright",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Charles Wright",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "James Wright",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "James Wright",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "James Wright",
		"target": "Hall_New Poets of England and America_1957",
		"weight": "1"
	},
	{
		"source": "James Wright",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "James Wright",
		"target": "Vendler_Contemporary American Poetry_1985",
		"weight": "1"
	},
	{
		"source": "Jay Wright",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Jay Wright",
		"target": "McClatchy_Contemporary American Poetry_1990",
		"weight": "1"
	},
	{
		"source": "Mark Wunderlich",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "John Yau",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "William Butler Yeats",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Monica Youn",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Al Young",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Al Young",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Al Young",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "David Young",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "David Young",
		"target": "Halpern_The New Poetry Anthology_1975",
		"weight": "1"
	},
	{
		"source": "Dean Young",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Kevin Young",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "La Monte Young",
		"target": "UbuWeb",
		"weight": "1"
	},
	{
		"source": "Matthew Zapruder",
		"target": "Elliston",
		"weight": "1"
	},
	{
		"source": "Andrew Zawacki",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Andrew Zawacki",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Lisa Zeidner",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Paul Zimmer",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Paul Zimmer",
		"target": "Dacey_Strong Measures_1986",
		"weight": "1"
	},
	{
		"source": "Rachel Zucker",
		"target": "PennSound",
		"weight": "1"
	},
	{
		"source": "Rachel Zucker",
		"target": "voca",
		"weight": "1"
	},
	{
		"source": "Louis Zukofsky",
		"target": "PennSound",
		"weight": "1"
	}
] 

 */
