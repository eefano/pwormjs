
var xres,yres,canvas,context;
var keys = [];
var field = [];
var tick = 0;

var stab = [];
var ctab = [];

var TABSIZE = 2048, TABAND = 2047, T_PI = 1024, T_PI2 = 512;
var MAXTICK = 100000;

var isplay,nplay,pizzax,pizzay,pizzar;
var wall,worm,pizza,air;

var keymap = [];
var play = [];
var leftkeys = [90,74,37];
var rightkeys = [88,75,39];

function calctab()
{
    var x;
    for(x=0;x<TABSIZE;x++)
    {
        stab[x]=Math.sin(Math.PI*x/T_PI);
        ctab[x]=Math.cos(Math.PI*x/T_PI);
    }
}

function getPixel(x,y)
{
    if(x<0 || y<0 || x>=xres || y>=yres) return -1;
    return field[Math.floor(x)+Math.floor(y)*xres];
}

function setPixel(x,y,v)
{
    if(x<0 || y<0 || x>=xres || y>=yres) return;
    field[Math.floor(x)+Math.floor(y)*xres]=v;
}

function check(o,x,y)
{
    var p = getPixel(x,y);
    if(p) o.push(p);
}
function draw(o,x,y)
{
    context.putImageData(o.i,x,y);
    setPixel(x,y,o.v);
}

function wormLambda(f,o,x,y)
{
    f(o,x,y);
    f(o,x-1,y);
    f(o,x+1,y);
    f(o,x,y-1);
    f(o,x,y+1);
}
function circleLambda(f,o,x,y,xc,yc)
{
    f(o,x+xc,y+yc);
    f(o,x+xc,yc-y);
    f(o,xc-x,yc-y);
    f(o,xc-x,y+yc);
    f(o,y+xc,x+yc);
    f(o,y+xc,yc-x);
    f(o,xc-y,yc-x);
    f(o,xc-y,x+yc);
}
function pizzaLambda(f,o,xc,yc,ray)
{
    var x,y,delta;
    y=ray;
    delta=3-(ray*2);
    for(x=0;x<y;)
    {
        circleLambda(f,o,x,y,xc,yc);
        if(delta<0) delta+=4*x+6;
        else
        {
            delta+=4*(x-y)+10;
            y--;
        }
        x++;
    }
    x=y;
    if(y!=0)
    {
        circleLambda(f,o,x,y,xc,yc);
    }
}

function deletePizza()
{
    pizzaLambda(draw,{i:air},pizzax,pizzay,pizzar);
}

function scorestring(player,i)
{
    return "PL"+i+":"+player.cdim;
}

function playersLambda(f)
{
    var i;
    var res = [];
    for(i=0;i<nplay;i++)
    {
        res[i] = f(play[i],i);
    }
    return res;
}

function putstatus(s)
{
    document.title = s.concat(" - ",playersLambda(scorestring));
}



function placePizza()
{
    putstatus("");
    for(;;)
    {
        var coll = [];
        var r = Math.floor(Math.random() * 7) + 3;
        var x = Math.floor(Math.random() * (xres-r*2)) + r;
        var y = Math.floor(Math.random() * (yres-r*2)) + r;

        pizzaLambda(check,coll,x,y,r);

        if(coll.length==0)
        {
            pizzaLambda(draw,{i:pizza,v:-2},x,y,r);
            pizzax=x; pizzay=y; pizzar=r;
            return;
        }
    }
}

function endgame(s)
{
    putstatus(s);
    isplay = false;
}

function collisions(player,n)
{
    var coll = [];
    wormLambda(check,coll,player.xp,player.yp);

    if(coll.indexOf(-1)>=0)
    {
        endgame("PLAYER "+n+" SPLATTED INTO WALL");
    }
    else if(coll.indexOf(-2)>=0)
    {
        player.cdim+=pizzar;
        deletePizza();
        placePizza();
    }
    else if(coll.length>0)
    {
        var i;
        for(i=0;i<coll.length;i++)
        {
            if(tick-coll[i]>3)
            {
                endgame("PLAYER "+n+" SPLATTED INTO WORM");
            }
        }
    }
}


function advancement(player,i)
{
    wormLambda(draw,{i:worm,v:tick},player.xp,player.yp);

    player.cx.push(player.xp);
    player.cy.push(player.yp);

    if(player.cx.length>player.cdim)
    {
        var x = player.cx.shift();
        var y = player.cy.shift();

        wormLambda(draw,{i:air},x,y);
    }

    player.xp+=stab[player.ang]*0.7;
    player.yp+=ctab[player.ang]*0.7;

    if(keys[leftkeys[i]])
    {
        player.ang+=32;
        if(player.ang>=TABSIZE) player.ang-=TABSIZE;
    }
    if(keys[rightkeys[i]])
    {
        player.ang-=32;
        if(player.ang<0) player.ang+=TABSIZE;
    }

}

function initgame(n)
{
    var i,x,y,d=xres/(n+1);

    field = [];

    context.fillStyle="black";
    context.fillRect(0,0,xres,yres);

    for(i=0,x=d,y=yres/2;i<n;i++,x+=d)
    {
        play[i] = {
            xp: x,
            yp: y,
            cx: [],
            cy: [],
            ang: 0,
            cdim: 50
        };
    }

    nplay=n;
    placePizza();
    tick=1;
    isplay=true;
}


function step()
{
    if(isplay)
    {
        playersLambda(collisions);
        playersLambda(advancement);
        tick++;
    }

    window.requestAnimationFrame(step);
}


function resize()
{
    var h = window.innerHeight;
    var w = window.innerWidth;

    var kx = Math.floor(w / xres);
    var ky = Math.floor(h / yres);
    var k = 1;

    if(kx<ky)
    {
        if(kx>1) k=kx; else k=1;
    }
    else
    {
        if(ky>1) k=ky; else k=1;
    }

    canvas.style.width = (xres*k)+'px';
    canvas.style.height = (yres*k)+'px';
}

function keypress(e)
{
    if(e.charCode==49)
    {
        initgame(1);
    }
    if(e.charCode==50)
    {
        initgame(2);
    }
    if(e.charCode==51)
    {
        initgame(3);
    }

 return false;
}

function keydown(e)
{
    keys[e.keyCode]=true;
    return false;
}
function keyup(e)
{
    keys[e.keyCode]=false;
    return false;
}

function createPixel(ctx,r,g,b)
{
    var p = ctx.createImageData(1,1);
    p.data[0]=r; p.data[1]=g; p.data[2]=b; p.data[3]=255;
    return p;
}

function load()
{
    canvas=document.querySelector('canvas');
    context = canvas.getContext( '2d' );

    xres = canvas.width;
    yres = canvas.height;

    /*
    dbuf = document.createElement('canvas');
    dbuf.width = xres;
    dbuf.height = yres;
    dbufctx = dbuf.getContext('2d');
     */

    resize();
    canvas.focus();
    canvas.addEventListener('keydown',keydown,true);
    canvas.addEventListener('keyup',keyup,true);
    canvas.addEventListener('keypress',keypress,true);

    pizza = createPixel(context,0,255,0);
    wall = createPixel(context,0,0,255);
    worm = createPixel(context,255,255,0);
    air = createPixel(context,0,0,0);

    wormLambda(draw,{i:worm},10,10);
    pizzaLambda(draw,{i:pizza},100,100,20);

    calctab();
    endgame("PIZZA WORM - PRESS [1] TO RESTART SOLO [2] 2 WORMS [3] DUUH - [Z][X] TURN WORM1 [J][K] WORM2 [ARROWS] WORM3");
    window.requestAnimationFrame(step);
}
