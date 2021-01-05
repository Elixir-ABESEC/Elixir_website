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
     TweenMax.set(mkr.getRule('.node .gitlogo'), {cssRule:{width:this.nodeH, height:this.nodeH}});
     TweenMax.set(mkr.getRule('.node .linkedinlogo'), {cssRule:{width:this.nodeH, height:this.nodeH}});
     
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
       mkr.setDefault(this._data, 'Designation', ''); 
       mkr.setDefault(this._data, 'Team', ''); 
       
       
       mkr.setDefault(this._data, 'thumb', 'https://www.1.fm/images/blank.jpg'); //thumbnail url
       mkr.setDefault(this._data, 'gitlogo', 'https://seeklogo.com/images/G/github-logo-5F384D0265-seeklogo.com.png'); //thumbnail url
       mkr.setDefault(this._data, 'linkedinlogo', 'https://cdn4.iconfinder.com/data/icons/social-messaging-ui-color-shapes-2-free/128/social-linkedin-circle-512.png'); //thumbnail url
       
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
                 <p class='Designation'>
                   <span class='lbl'>Designation: </span>
                   <span class='date'></span><span class='place'></span>
                 </p>
                 <div class='gitlogo'><img src=''/></div>
                 <div class='linkedinlogo'><img src=''/></div>
                 
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