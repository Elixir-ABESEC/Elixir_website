/*
Family Tree
Consists of nodes
Tree is the overarching data structure that manages nodes
Nodes are the primary object in the tree, have direct child-parent relationships with other nodes. Nodes may only have one parent node
*/

var xist = {};
xist.tree = (function() {
  var _count = 0;
  var tree = function(options, data) {
    this._id = 'tree-'+_count++;
    this._root = mkr.default(options.root, null); 
    this._dir = mkr.default(options.dir, xist.tree.TOP_DOWN); //topDown, bottomUp, leftRight, rightLeft
    this._grid = mkr.default(options.grid, null); 
    options.view = mkr.default(options.view, {});
    this._nodeW = mkr.default(options.nodeW, 250);
    this._nodeH = mkr.default(options.nodeH, 65);
    this._gap = mkr.default(options.gap, 40);
    this._parent = mkr.default(options.parent, document.body);
    this._data = mkr.default(data, null);
    this._width = this._height = 0;
    this._resized = new signals.Signal();
		
    TweenMax.set(mkr.getRule('.node'), {cssRule:{width:this.nodeW, height:this.nodeH}});
    TweenMax.set(mkr.getRule('.node .thumb'), {cssRule:{width:this.nodeH, height:this.nodeH}});
    
    mkr.setDefault(options.view, 'attr', {});
    mkr.setDefault(options.view.attr, 'class', 'tree');
    mkr.setDefault(options.view.attr, 'id', this.id);
    mkr.setDefault(options.view, 'css', {});
    mkr.setDefault(options.view.css, 'width', '100%');
    mkr.setDefault(options.view.css, 'height', '100%');
    mkr.setDefault(options.view.css, 'background', '#dddddd');
    
    this._view = mkr.query('#'+options.view.attr.id) || mkr.create('div', options.view, this._parent);
    this._svg = mkr.query('#'+options.view.attr.id, this.view) ||mkr.create('svg', {attr:{class:'lines'}, css:{width:'100%', height:'100%', pointerEvents:'none', overflow:'visible'}}, this.view);
    
    Draggable.create(this.view, {type:"x,y", zIndexBoost:false});
    
    this.update();
  };
  
  tree.prototype = {
    get id() {
      return this._id;
    },
    get dir() {
      return this._dir;
    },
    set dir(value) {
      this._dir = value;
      this.refresh();
    },
    get grid() {
      return this._grid;
    },
    get data() {
      return this._data;
    },
    set data(value) {
      this._data = value;
      this.update();
    },
    get view() {
      return this._view;
    },
    get svg() {
      return this._svg;
    },
		get nodeW() {
      return this._nodeW;
    },
    get nodeH() {
      return this._nodeH;
    },
    get gap() {
      return this._gap;
    },
    get count() {
      return this._count;
    },
    get root() {
      return this._root;  
    },
    get pairs() {
      return this._pairs;
    },
    get gridW() {
      return this._gridW;
    },
    get gridH() {
      return this._gridH;
    },
    get width() {
      return this._width;
    },
    get height() {
      return this._height;
    },
    get depth() {
      return xist.node.instances[this.root].depth;
    },
    get breadth() {
      return xist.node.instances[this.root].breadth;
    },
		get resized() {
			return this._resized;
		},
    get x() {
      return xist.node.instances[this.root].x;
    },
    set x(value) {
      var root = xist.node.instances[this.root];
      root.x = root._originX = value;
      root.refresh();
    },
    get y() {
      return xist.node.instances[this.root].y;
    },
    set y(value) {
      var root = xist.node.instances[this.root];
      root.y = root._originY = value;
      root.refresh();
    },
    
    setXY: function(x, y) {
      var root = xist.node.instances[this.root];
      root.x = root._originX = x;
      root.y = root._originY = y;
      root.setOrigin(root.x, root.y);
      root.refresh();
    },
    
    create: function(options, data) {
      options = options || {};
      options.tree = this;
      var node = new xist.node(options, data);
      return node;
    },
    
    add: function(node) {
      if(node.tree) {
        if(node.tree === this) return;
       	node.tree.remove(node.id);
      }
      node.tree = this;
      if(!this._root) this._root = node.id;
    },
    
    remove: function(id) {
     	if(this.root == id) this._root = null;
    },
    delete: function(id) {
      var node = xist.node.instances[id];
      node.destroy();     
    },
    
    refresh: function() {
      if(!this.root)
        return;
     
      var root = xist.node.instances[this.root];
      //run DFS to find/assign breadths of all subtrees
      root.findBreadth(this);
      
      //run DFS to find/assign depths of all subtrees
      root.findDepth(); 
      
      //run BFS to set offsets
      root.refresh();
      
			var w, h;
      switch(this.dir) {
        default:
        case xist.tree.TOP_DOWN :
        case xist.tree.BOTTOM_UP :
          w = root.breadth*this.nodeW + (root.breadth-1)*this.gap;
          h = (root.depth+1)*this.nodeH + root.depth*this.gap;
          break;
          
        case xist.tree.LEFT_RIGHT :
        case xist.tree.RIGHT_LEFT :
          w = (root.depth+1)*this.nodeW + root.depth*this.gap;
          h = root.breadth*this.nodeH + (root.breadth-1)*this.gap;
          break;
      }
			var resized = false;
			if(this._width != w) {
				this._width = w;
				resized = true;
			}
			if(this._height != h) {
				this._height = h;
				resized = true;
			}
			if(resized) this.resized.dispatch();
    },
    
    clear: function() {
      if(this.root) {
        this.root.destroy();
        this.root = null;
      }
    },
    
    update: function() {
      if(this.root)
        xist.node.instances[this.root].data = this.data;
      else(this.data) 
        this.create({}, this.data);
    }
  };
  
  tree.TOP_DOWN = 0;
  tree.BOTTOM_UP = 1;
  tree.LEFT_RIGHT = 2;
  tree.RIGHT_LEFT = 3;
  return tree;
})();

//node class
xist.node = (function() {
  var node = function(options, data) {
    this._id = uuid.v1();
    xist.node.instances[this._id] = this;
    var tree = options.tree;
    this._parent = mkr.default(options.parent, null);
    this._children = mkr.default(options.children, []) || [];
    this._lines;
    this._depth = 0;
    this._breadth = 1;
    this._target = null;
    this._originX = this._originY = 0;
    
    tree.add(this);
    
    //data setup
    this.data = mkr.default(data, {});
    
    mkr.setDefault(options, 'x', 0);
    mkr.setDefault(options, 'y', 0);
    //this.createView(options.x, options.y);
    
    //drag/drop functionality
    var self = this;
    if(!this.isRoot) {
      this._dragger = Draggable.create(this.view, {
        type:"x,y", edgeResistance:0.65, bounds:this.tree.view.container,
        onPress: function(e) {
          e.stopPropagation();
          if(mkr.hasClass(this.target, 'selected') < 0) {
            TweenLite.set('.node.selected', {className:"-=selected"});
            TweenLite.set(this.target, {className:"+=selected"});
          }
          else {
            TweenLite.set(this.target, {className:"-=selected"});
          }
        },
        onDrag: function(e) {
          self.refresh();
          xist.node.setBox(self.x, self.right, self.y, self.bottom);
          var nodes = self.tree.grid.search(xist.node.box);
          var i = nodes.length;

          while(--i > -1) { //dropTarget all nodes expect self
            if(nodes[i].id == self.id) continue;
            TweenLite.set(nodes[i], {className:"+=dropTarget"});
          }

          //remove dropTarget class from old targets
          var targets = mkr.queryAll('.node.dropTarget');
          i = targets.length;
          while(--i > -1) {
            var target = targets[i];
            if(nodes.indexOf(target) < 0) TweenMax.set(target, {className:'-=dropTarget'});
          }
        },
        onRelease: function(e) {
          e.stopPropagation(); //allow nodes to be dragged without affecting the container

          xist.node.setBox(self.x, self.right, self.y, self.bottom);
          var nodes = self.tree.grid.search(xist.node.box);
          var i = nodes.length;
          while(--i > -1) {
            if(nodes[i].id == self.id) continue;
            self._target = nodes[i];
            break;
          }

          TweenLite.set('.node.dropTarget', {className:"-=dropTarget"});
          if(self._target) {
            /* console.log(self._target.id);
            console.log(self._target);
            console.log('\n'); */
            xist.node.getInstance(self._target.id).addChild(self);
            self._target=null;
          }
          else {
            self.snap();
          }
        }
      })[0];
    }
    
    //unused selectpicker code, maybe useful for extended tree
   /* var relate = function(e, index) {
      
      // create selectpicker for dropdown
      //  mkr.create('div', {attr:{id:`select-pop-${_count}`, class:'popover node-popover'}, css:{autoAlpha:0},
      //  text:`<div class="popover-content" id="select-${_count}">
      //      <button type="button" class="close" aria-hidden="true">×</button>
      //      <p>How is this node related to the target?</p>
      //      <select class="selectpicker" title="Choose one">
      //        <option>Parent</option>
      //        <option>Child</option>
      //      </select>
      //    </div>`
      // }, document.body);
    
      // if(self._target.id == self.tree.root) {
      //  TweenMax.to(mkr.query('.node-popover', self.tree.view.container), .5, {autoAlpha:1, display:'block'});
      //  $(self.tree.select).on('changed.bs.select', relate);
      //  mkr.on('.node-popover .close', 'click', cancelOp);
      //  return;
      // }
      
      //console.log(index, $(self.tree.select).selectpicker('val'));
      $(self.tree.select).off('changed.bs.select', relate);
      
      mkr.off('.node-popover .close', 'click', cancelOp);
      TweenMax.to(mkr.query('.node-popover', self.tree.view.container), .5, {autoAlpha:0});
      $(self.tree.select).selectpicker('val', '');
      
      if(index == 1) {
        //balls
      }
      else {
        xist.node.instances[self._target.id].addChild(self);
      }
      self._target = null;
    };
    
    var cancelOp = function() {
      self._target = null;
      $(self.tree.select).off('changed.bs.select', relate);
      mkr.off('.node-popover .close', 'click', cancelOp);
      TweenMax.to(mkr.query('.node-popover', self.tree.view.container), .5, {autoAlpha:0});
    };*/
  };
  
  node.prototype = {
    get id() {
      return this._id;
    },
    get isRoot() {
      return this.id === this.tree.root;  
    },
    get tree() {
      return this._tree;
    },
		set tree(value) {
      var n = this.children.length;
      this._tree = value;
      for(var i = 0; i < n; i++) {
        this.childAt(i).tree = value;
      }
    },
    get lines() {
      return this._lines;
    },
    get data() {
      return this._data;
    },
    set data(value) {
      var children;
      if(value && 'children' in value) {
        children = value.children.concat();
        delete value.children;
      }
      this._data = mkr.default(value, {}) || {};
      mkr.setDefault(this._data, 'name', '');
      mkr.setDefault(this._data, 'dob', ''); //date of birth
      mkr.setDefault(this._data, 'pob', ''); //place of birth
      mkr.setDefault(this._data, 'dod', ''); //date of death
      mkr.setDefault(this._data, 'pod', ''); //place of death
      mkr.setDefault(this._data, 'thumb', 'https://www.1.fm/images/blank.jpg'); //thumbnail url
      
      this.view ? this.update() : this.createView();
      
      this.children = children;
    },
    get children() {
      return this._children;  
    },
    set children(value) {
      if(this.children.length) {
        this.destroyChildren();
      }
      var len = value ? value.length : 0, node;
      for(var i = 0; i < len; i++) {
        node = this.tree.create({}, value[i]);
        this.addChild(node);
      }
    },
    get parent() {
      return this._parent;  
    },
    set parent(value) {
      this._parent = value; 
    },
    get dragger() {
      return this._dragger;
    },
    get view() {
      return this._view;  
    },    
    get x() {
      return this.view._gsTransform.x;
    },
    set x(value) {
      TweenMax.set(this.view, {x:value});
      //this.refresh();
    },
    get y() {
      return this.view._gsTransform.y;
    },
    set y(value) {
      TweenMax.set(this.view, {y:value});
      //this.refresh();
    },
    get right() {
      return this.view._gsTransform.x + this.tree.nodeW;
    },
    get bottom() {
      return this.view._gsTransform.y + this.tree.nodeH;
    },
    get originX() {
      return this._originX;
    },
    set originX(value) {
      this.tree.grid.remove(this.view);
      this._originX = this.view.minX = value;
      this.view.maxX = this.originR;
      this.tree.grid.insert(this.view);
    },
    get originY() {
      return this._originY;
    },
    set originY(value) {
      this.tree.grid.remove(this.view);
      this._originY = this.view.minY = value;
      this.view.maxY = this.originB;
      this.tree.grid.insert(this.view);
    },
    get originR() {
      return this._originX + this.tree.nodeW;
    },
    get originB() {
      return this._originY + this.tree.nodeH;
    },
    
    get breadth() {
      return this._breadth;
    },
    get depth() {
      return this._depth;
    },
    
    setOrigin: function(x, y) {
      this.tree.grid.remove(this.view);
      this._originX = this.view.minX = x;
      this._originY = this.view.minY = y;
      this.view.maxX = this.originR;
      this.view.maxY = this.originB;
      this.tree.grid.insert(this.view);
    },
    
    createView: function(x, y) {
      x = mkr.default(x, 0);
      y = mkr.default(y, 0);
      this._view = mkr.create('div', {
        css:{x:x, y:y},
        attr:{id:this.id, class:'node'},
        text:`<div class='thumb'><img src=''/></div>
              <div class='details'>
                <p class='name'></p>
                <p class='born'>
                  <span class='lbl'>Born: </span>
                  <span class='date'></span><span class='place'></span>
                </p>
                <p class='died'>
                  <span class='lbl'>Died: </span>
                  <span class='date'></span><span class='place'></span>
                </p>
              </div>`
      }, this.tree.view);
      this.view.minX = x;
      this.view.minY = y;
      this.view.maxX = x + this.tree.nodeW;
      this.view.maxY = x + this.tree.nodeH;
      this.view._tree = this.tree.id;
			
			this._lines = [
				mkr.construct('ln', {attr:{class:'ln-0', x1:0, x2:0, y1:0, y2:0}}, '#'+this.tree.view.id+' .lines'),
				mkr.construct('ln', {attr:{class:'ln-1', x1:0, x2:0, y1:0, y2:0}}, '#'+this.tree.view.id+' .lines'),
				mkr.construct('ln', {attr:{class:'ln-2', x1:0, x2:0, y1:0, y2:0}}, '#'+this.tree.view.id+' .lines')
    	];
			
			if(this.isRoot) this.tree.refresh();
      this.update();
    },
    
    snap:function() {
      //console.log(this);
      TweenMax.to(this, .25, {x:this._originX, y:this._originY, onUpdate:this.refresh, onUpdateScope:this});
    },
    
    addChild: function(node) {
      var id = node.id;
      if(node.parent) {
        xist.node.instances[node.parent].removeChild(id);
      }
      this.tree.add(node);
      this.children.push(id);
      node.parent = this.id;
      this.tree.refresh();
    },
    
    addChildren: function(ids) {
      for(var id of ids) {
        this.addChild(id);
      }
    },
    removeChild: function(id) {
      var n = this.children.indexOf(id);
      if(n >= 0) {
        this.children.splice(n, 1);
        xist.node.instances[id].parent = null;
        this.tree.refresh();
      }
    },
    childAt: function(n) {
      if(n < 0) n += this.children.length;
      return xist.node.instances[this.children[n]];
    },
    clearChildren: function() {
      for(var id of this.children) {
        xist.node.instances[id].parent = null;
      }
      this.children = [];
    },
    destroyChildren: function() {
      for(var id of this.children) {
        xist.node.instances[id].destroy();
      }
      this.children = [];
    },
    
    destroy: function() {
      if(this.parent) { //remove from parent
        xist.node.instances[this.parent].removeChild(this.id);
        this.parent = null;
      }
      this.destroyChildren(); //destroy all children
      if(this.dragger) this.dragger.kill();
      mkr.remove(this.view);
			mkr.remove([this.lines[0].el, this.lines[1].el, this.lines[2].el]);
      this.tree.remove(this.id);
      delete xist.node.instances[this.id];
    },
    
    //DFS algorithm that determines the total breadth of each subtree
    findBreadth: function(tree) {
      var n = this.children.length;
      if(n == 0) {
        this._breadth = 1;
        return this._breadth;
      }
      
      var node, breadth=0;
      for(var i = 0; i < n; i++) {
        node = this.childAt(i);
        breadth += node.findBreadth(tree);
      }
      this._breadth = breadth;
      return breadth;
    },
    
    //DFS algorithm that determines the max depth of each subtree
    findDepth: function(level) {
      level=mkr.default(level,0);
      var n=this.children.length, depth, max=0;
      if(n > 0) {
        depth = 1;
        for(var i = 0; i < n; i++) {
          max = Math.max(max, this.childAt(i).findDepth(level+1));
        }
      }
      else {
        depth = 0;
      }
      this._depth = depth+max;
      return this._depth;
    },
    
    //BFS algorithm that handles node placement
    refresh: function() {
      var n = this.children.length;
      var node, total, startX, startY, delta, subTotal, step=0,
      gap=this.tree.gap, nodeW=this.tree.nodeW, nodeH=this.tree.nodeH;
      var x1
      switch(this.tree.dir) {
        default:
        case xist.tree.TOP_DOWN:
          //calculate total width of the subtree based on the breadth prop
          total = this.breadth*nodeW + (this.breadth-1)*gap;
          startX = this.x + (nodeW - total)/2;
          startY = this.y + nodeH + gap;
          delta = nodeW + gap;
          
          for(var i = 0; i < n; i++) {
            node = xist.node.instances[this.children[i]];
            subTotal = node.breadth*nodeW + (node.breadth-1)*gap;
            node.x = startX + step + (subTotal-nodeW)/2; 
            node.y = startY;
            node.setOrigin(node.x, node.y);
            
            step += subTotal + gap;
            node.refresh();
          }
          
          //update lines, line to parent
          TweenMax.set(this.lines[0], {
            x1:this.x+nodeW/2,
            x2:this.x+nodeW/2,
            y1:this.y-gap/2,
            y2:this.y
          });
          //perpendicular child line
          TweenMax.set(this.lines[1], {
            x1:this.x+nodeW/2,
            x2:this.x+nodeW/2,
            y1:this.y+nodeH,
            y2:this.y+nodeH+gap/2
          });
          //parallel child line
          if(this.children.length) {
            TweenMax.set(this.lines[2], {
              x1:this.childAt(0).x+nodeW/2,
              x2:this.childAt(-1).x+nodeW/2,
              y1:this.y+nodeH+gap/2,
              y2:this.y+nodeH+gap/2
            });
          }
          break;
        case xist.tree.BOTTOM_UP:
          //calculate total width of the subtree based on the breadth prop
          total = this.breadth*nodeW + (this.breadth-1)*gap;
          startX = this.x + (nodeW - total)/2;
          startY = this.y - nodeH - gap;
          delta = nodeW + gap;

          for(var i = 0; i < n; i++) {
            node = xist.node.instances[this.children[i]];
            subTotal = node.breadth*nodeW + (node.breadth-1)*gap;
            node.x = startX + step + (subTotal-nodeW)/2; 
            node.y = startY;
            node.setOrigin(node.x, node.y);
            
            step += subTotal + gap;
            node.refresh();
          }
          
          //update lines, line to parent
          TweenMax.set(this.lines[0], {
            x1:this.x+nodeW/2,
            x2:this.x+nodeW/2,
            y1:this.y+nodeH+gap/2,
            y2:this.y+nodeH
          });
          //perpendicular child line
          TweenMax.set(this.lines[1], {
            x1:this.x+nodeW/2,
            x2:this.x+nodeW/2,
            y1:this.y,
            y2:this.y-gap/2
          });
          //parallel child line
          if(this.children.length) {
            TweenMax.set(this.lines[2], {
              x1:this.childAt(0).x+nodeW/2,
              x2:this.childAt(-1).x+nodeW/2,
              y1:this.y-gap/2,
              y2:this.y-gap/2
            });
          }
          break;
        case xist.tree.LEFT_RIGHT:
          //calculate total height of the subtree based on the breadth prop
          total = this.breadth*nodeH + (this.breadth-1)*gap;
          startX = this.x + nodeW + gap;
          startY = this.y + (nodeH - total)/2;
          delta = nodeH + gap;

          for(var i = 0; i < n; i++) {
            node = xist.node.instances[this.children[i]];
            subTotal = node.breadth*nodeH + (node.breadth-1)*gap;
            node.x = startX; 
            node.y = startY + step + (subTotal-nodeH)/2;
            node.setOrigin(node.x, node.y);
            
            step += subTotal + gap;
            node.refresh();
          }
          
          //update lines, line to parent
          TweenMax.set(this.lines[0], {
            x1:this.x-gap/2,
            x2:this.x,
            y1:this.y+nodeH/2,
            y2:this.y+nodeH/2
          });
          //perpendicular child line
          TweenMax.set(this.lines[1], {
            x1:this.x+nodeW,
            x2:this.x+nodeW+gap/2,
            y1:this.y+nodeH/2,
            y2:this.y+nodeH/2
          });
          //parallel child line
          if(this.children.length) {
            TweenMax.set(this.lines[2], {
              x1:this.x+nodeW+gap/2,
              x2:this.x+nodeW+gap/2,
              y1:this.childAt(0).y+nodeH/2,
              y2:this.childAt(-1).y+nodeH/2,
            });
          }
          break;
        case xist.tree.RIGHT_LEFT:
          //calculate total height of the subtree based on the breadth prop
          total = this.breadth*nodeH + (this.breadth-1)*gap;
          startX = this.x - (nodeW + gap);
          startY = this.y + (nodeH - total)/2;
          delta = nodeH + gap;

          for(var i = 0; i < n; i++) {
            node = xist.node.instances[this.children[i]];
            subTotal = node.breadth*nodeH + (node.breadth-1)*gap;
            node.x = startX; 
            node.y = startY + step + (subTotal-nodeH)/2;
            node.setOrigin(node.x, node.y);
            
            step += subTotal + gap;
            node.refresh();
          }
          
          //update lines, line to parent
          TweenMax.set(this.lines[0], {
            x1:this.x+nodeW+gap/2,
            x2:this.x+nodeW,
            y1:this.y+nodeH/2,
            y2:this.y+nodeH/2
          });
          //perpendicular child line
          TweenMax.set(this.lines[1], {
            x1:this.x,
            x2:this.x-gap/2,
            y1:this.y+nodeH/2,
            y2:this.y+nodeH/2
          });
          //parallel child line
          if(this.children.length) {
            TweenMax.set(this.lines[2], {
              x1:this.x-gap/2,
              x2:this.x-gap/2,
              y1:this.childAt(0).y+nodeH/2,
              y2:this.childAt(-1).y+nodeH/2,
            });
          }
          break;
      }
      //update line visibility
      TweenMax.set(this.lines[0].el, {autoAlpha:this.parent?1:0});
      TweenMax.set([this.lines[1].el, this.lines[2].el], {autoAlpha:this.children.length?1:0});
    },
    
    //update node based on data
    update: function() {
      TweenMax.set(mkr.query('.thumb img', this.view), {attr:{src:this.data.thumb}});
      TweenMax.set(mkr.query('.name', this.view), {text:this.data.name});
      TweenMax.set(mkr.query('.born .lbl', this.view), {autoAlpha:(this.data.dob || this.data.pob)});
      TweenMax.set(mkr.query('.born .date', this.view), {text:this.data.dob});
      TweenMax.set(mkr.query('.born .place', this.view), {text:(this.data.dob ? ', ' : '')+this.data.pob});
      TweenMax.set(mkr.query('.died .lbl', this.view), {autoAlpha:(this.data.dod || this.data.pod)});
      TweenMax.set(mkr.query('.died .date', this.view), {text:this.data.dod});
      TweenMax.set(mkr.query('.died .place', this.view), {text:(this.data.dod ? ', ' : '')+this.data.pod});
    }
  };
  
  node.instances = {};
  node.getInstance = function(id) {
    return node.instances[id];
  };
  
  node.box = {};
  node.setBox = function(minX, maxX, minY, maxY) {
    node.box.minX = minX;
    node.box.maxX = maxX;
    node.box.minY = minY;
    node.box.maxY = maxY;
  };
  return node;
})();

//immediate family tree
xist.iTree = (function() {

  var iTree = function(data, options) {
		//default data
		data = data || [];
		data[0] = mkr.default(data[0], {name:'You'});
		data[1] = mkr.default(data[1], {name:'Mom'});
		data[2] = mkr.default(data[2], {name:'Dad'});
		
		//default options
    options = options || {};
		this._parent = mkr.default(options.parent, document.body);
    this._zoom = mkr.default(options.zoom, 1);
    
    //create shared dom elements
    var m = new mkr({attr:{id:'tree-container'}, css:{width:'100%', height:'100%', background:'transparent', overflow:'hidden'}});
    m.create('div', {attr:{id:'trees', class:'tree'}});
    m.create('div', {attr:{id:'trees-bg'}, css:{border:'1px solid black', padding:'25px', x:-25, y:-25}}, '#trees');
    
    //create shared spatial grid
    this._grid = rbush(10);
    
    //root tree
    this.root = new xist.tree({
      dir: xist.tree.TOP_DOWN,
      view: {attr:{id:'trees'}},
      grid: this._grid
    }, data[0]);

    //mom tree
    this.mom = new xist.tree({
      dir: xist.tree.RIGHT_LEFT,
      view: {attr:{id:'trees'}},
      grid: this._grid
    }, data[1]);

    //dad tree
    this.dad = new xist.tree({
      dir: xist.tree.LEFT_RIGHT,
      view: {attr:{id:'trees'}},
      grid: this._grid
    }, data[2]);
    
    this.onTreeResize();
    this.centerOnRoot();
    
    this._grid.clear();
    this._grid.load(Array.prototype.slice.call(mkr.queryAll('#trees .node')));
    
		this.mom.resized.add(this.onTreeResize, this);
		this.dad.resized.add(this.onTreeResize, this);
		this.root.resized.add(this.onTreeResize, this);
		
    //create ui elements
    //create a button/click listener to toggle animation
    m.create('div', {attr:{id:'addNode', class:'btn btn-primary'}, css:{bottom:10, right:10}, text:'Add node'}, this._parent);
    
    //add ui events
    mkr.on('#tree-container', 'wheel', function(e) {
      this.zoom -= e.deltaY/150;
    }, this);
    
    mkr.on('#addNode', 'click', function() {
      this.root.create();
    }, this);
  };
  
  iTree.prototype = {
    get zoom() {
      return this._zoom;
    },
    set zoom(value) {
      this._zoom = Math.min(2, Math.max(.25, value));
      TweenMax.to('#trees', .2, {scale:this._zoom});
    },
		
		set data(value) {
			var data = value || [];
			data[0] = mkr.default(data[0], {name:'You'});
			data[1] = mkr.default(data[1], {name:'Mom'});
			data[2] = mkr.default(data[2], {name:'Dad'});
			
			this.root.data = data[0];
			this.mom.data = data[1];
			this.dad.data = data[2];
			
			this.centerOnRoot();
		},
		
		clear: function() {
			this.data = null;
		},
		
		onTreeResize: function() {
			//position trees based on dimensions
			var momX, momY, dadX, dadY, rootX, rootY;
			var momX = this.mom.width - this.mom.nodeW;
			var dadX = momX + this.root.nodeW + 2*this.root.gap;

			var maxH = Math.max(this.dad.height, this.mom.height);
			var momY = dadY = maxH/2 - this.root.nodeH/2;

			rootX = momX + ((this.mom.nodeW + this.dad.nodeW + 2*this.root.gap) - this.root.nodeW)/2;
			rootY = momY + this.root.nodeH + 2*this.root.gap;

			this.mom.setXY(momX, momY);
			this.dad.setXY(dadX, dadY);
			this.root.setXY(rootX, rootY);

			//determine total dimensions and apply to the tree container
			var w = this._width = this.mom.width + this.dad.width + 2*this.root.gap;
			var h = this._height = maxH;
			if((momY + maxH/2) < (rootY + this.root.height)) {
				 h = (rootY + this.root.height);
			}
			TweenMax.set('#trees', {width:w, height:h});
			TweenMax.set('#trees-bg', {width:w+50, height:h+50});
		},
		
    centerOnRoot: function() {
      TweenMax.set('#trees', {
        x:(mkr.query('#tree-container').offsetWidth - this._width)/2,
        y:(mkr.query('#tree-container').offsetHeight - this._height)/2
      });
    }
  };
  
  return iTree;
})();

var data = [
  {
   name: 'Samuel B Hershey', dob:'12.8.1976', pob:'Cleveland, OH',
       children: [
         {name: 'Samuel A Hershey', dob:'10.19.2014', pob:'Chapel Hill, NC'}
    ]
  },
  {
   name:'Birgit Winzer', dob:'10.27.1943', pob:'Boston, MA',
    children: [
      {name: 'Ingrid Martens', dob:'12.20.1923',
       children: [
         {name: 'Bertha Groth', dob:'6.7.1888', dod:'1.1.1972',
          children: [
            {name: 'Christine Voigt'},
            {name: 'Christian Groth'},
          ]},
         {name: 'Ludwig Martens', dob:'3.26.1892', dod:'4.4.1972',
          children: [
            {name: 'Emma Luders'},
            {name: 'Johan Martens'},
          ]},
       ]},
      {name: 'Hans Winzer', dob:'4.2.1923', pob:'Boston, MA', dod:'7.26.1982', pod:'Cleveland, OH',
       children: [
         {name: 'Edith Rempel', dob:'5.7.1882', dod:'4.30.1959',
          children: [
            {name: 'Anna Siebert'},
            {name: 'Gustav Rempel'},
          ]},
         {name: 'John Winzer', dob:'3.23.1887', dod:'7.26.1982',
          children: [
            {name: 'Sarah Graham'},
            {name: 'Julius Winzer'},
          ]},
       ]}
    ]
  },
  {
   name: 'Loren Hershey', dob:'12.8.1976', pob:'Milwaukee, WI',
    children: [
      {name: 'Josephine Rosenburg', dob:'9.5.1916', pob:'Milwaukee, WI',
       children: [
         {name: 'Dora Heiser', dob:'1.2.1896', pob:'Milwaukee, WI',
          children: [
            {name: 'Josephine'},
            {name: 'Henry Heiser'},
          ]},
         {name: 'Simon Rosenburg', dob:'9.5.1916', pob:'Milwaukee, WI',
          children: [
            {name: 'Hannah'},
            {name: 'Benard Rosenburg'},
          ]},
       ]},
      {name: 'Alvin Hershey', dob:'12.20.1915', pob:'Cleveland, OH', dod:'3.4.1974', pod:'Cleveland, OH',
       children: [
         {name: 'Bess Fried', dob:'12.8.1891', dod:'1978', pod:'Cleveland, OH',
          children: [
            {name: 'Esther Green'},
            {name: 'Irviny Fried'},
          ]},
         {name: 'Ben Hershovitz', dob:'1889', dod:'1935',
          children: [
            {name: 'Ruth'},
            {name: 'Jacob Hershovitz'},
          ]},
       ]}
    ]
  }
];
//data = [];
var tree = new xist.iTree(data);