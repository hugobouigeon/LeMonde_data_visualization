const ctx = {
    input : 'Monde',
    w: 1000,
    h: 1000,
    JITTER_W: 50, //not needed? wtf is that
    grouped_articles: [],
    indiv_articles: [],
    START_DATE: "2021-12-01",
    END_DATE: "2022-12-08",
    MIN_START_DATE: "2021-12-15",
    MAX_END_DATE: "2022-12-13",
    START: 0,
    END: 0,
    SELECTED_DATE: "",
    CURRENT_R: 0,
    
};
//MEMO could uppercase first letters in trends, enlargen trend words on ouseover




var handleKeyEvent = function(e){
  if (e.keyCode === 13){
      // enter
      e.preventDefault();
      setSample();
  }
};

var setSample = function(){
  var sampleVal = document.querySelector('#sampleTf').value;
  if (sampleVal.trim()===''){
      return;
  }
  var startdateval = document.querySelector('#startdate').value;
  if (startdateval.trim()===''){
      return;
  }
  var enddateval = document.querySelector('#enddate').value;
  if (enddateval.trim()===''){
      return;
  }
  ctx.input = sampleVal;
  ctx.START_DATE = startdateval;
  ctx.END_DATE = enddateval;
  if (ctx.START_DATE>ctx.END_DATE){
    let aux = ctx.START_DATE;
    ctx.START_DATE=ctx.END_DATE;
    ctx.END_DATE = aux;
  }
  if (ctx.START_DATE<ctx.MIN_START_DATE){
    ctx.START_DATE=ctx.MIN_START_DATE;
  }
  if (ctx.END_DATE>ctx.MAX_END_DATE){
    ctx.END_DATE=ctx.MAX_END_DATE;
  }

  plotdata();
};

function densityPlot(data,id){

    var dates = [];

    dates.push(ctx.START);
    dates.push(ctx.END);
    let idtimescale = d3.scaleLinear()
      .domain(dates) 
      .range([0,ctx.w]);

    let calcTime = data.map(function(p){return get_id_from_date(p.date);});

    let n = calcTime.length,
        density = kernelDensityEstimator(kernelEpanechnikov(7), idtimescale.ticks(12))(calcTime);
    let maxDensity = d3.max(density, (d) => (d[1]));
    let densityScale = d3.scaleLinear()
            .domain([0, maxDensity])
            .range([0, 80]);
    // remove entries where y=0 to avoid unnecessarily-long tails
    let i = density.length - 1;
    let lastNonZeroBucket = -1;
    while (i>=0){
        // walk array backward, find last entry >0 at index n, keep n+1
        if (density[i][1] > 0){
            lastNonZeroBucket = i;
            break;
        }
        i--;
    }
    if (lastNonZeroBucket != -1){
        density = density.splice(0, lastNonZeroBucket+3);
    }
    // insert a point at 0,0 so that the path fill does not cross the curve
    density.unshift([0,density[0][1]]);
    density.unshift([0,0]);
    density.push([ctx.END,density[density.length-1][1]]);
    density.push([ctx.END,0]);


    d3.select(id).append("path")
        .datum(density)
        .attr("fill", "#b3576a")
        .attr("opacity", 0.0)
        .attr("transform", "rotate(-90) translate(-600,00)")
        .attr("stroke", "#4f262f")
        .attr("stroke-width", 2)
        .attr("stroke-linejoin", "round")
        .attr("d", d3.line()
            .curve(d3.curveBasis)
            .x(function(d) { return densityScale(d[1])/* curve point x-coord */ })
            .y(function(d) { return idtimescale(d[0])/* curve point y-coord */ }))
        .transition(d3.transition()
          .duration(200)
          .ease(d3.easeCubic))
        .attr("opacity", 0.3);
    };

function plotdata(){

  ctx.START=get_id_from_date(ctx.START_DATE);
  ctx.END=get_id_from_date(ctx.END_DATE);

  graphEl.selectAll("rect")
    .transition(d3.transition()
      .duration(300)
      .ease(d3.easeCubic))
    .attr("height", 0)
    .remove();

  if (ctx.SELECTED_DATE !=""){
  image_disapear();image_animation(ctx.grouped_articles[get_id_from_date(ctx.SELECTED_DATE)-1]);
  }

  graphEl.selectAll("path")
    .transition(d3.transition()
      .duration(700)
      .ease(d3.easeCubic))
    .attr("opacity", 0)
    .remove();

  graphEl.selectAll("text:not(#dt)").remove();
  graphEl.selectAll("line").remove();

  load_logo();

    ctx.input = ctx.input.toLowerCase();
  wdt = ctx.w/(ctx.END - ctx.START + 1);
  
  if (ctx.input == "*"){

    let maxi = 0;
    for (let i = 0; i<ctx.grouped_articles.length;i++){
      if (ctx.grouped_articles[i].amount>maxi){
        maxi = ctx.grouped_articles[i].amount;
      }
    }
        
    graphEl.selectAll("path.node")
      .data(ctx.grouped_articles)
      .enter()
      .append("rect")
      .attr("y", 0)
      .attr("x", 0)
      .attr("transform", (d) => (`translate(${(parseInt(d.id)-ctx.START-1)*wdt},600)`))
      .attr("fill", "#c7af36")
      .attr("opacity", 1)
      .attr("width", wdt)
      .attr("height", (d) => (d.amount/maxi*100))
      .on('mouseover', function (d, i) {      
        d3.select(this).transition()
             .duration('5')
             .attr('opacity', 0.8);})
      .on('mouseout', function (d, i) {
        d3.select(this).transition()
             .duration('5')
             .attr('opacity', 1);})
      .on("click",
            (event,d) => {image_disapear();image_animation(d); ctx.SELECTED_DATE = d.date; })
      //.on("mouseout",
      //      (event,d) => {image_disapear();})      
      .append("svg:title")
        .text((d) => (`${d.date} \n${d.amount} Articles`));

    densityPlot(ctx.indiv_articles, "#graph");

  }
  else{

    let maxi = 0;
    for (let i = 0; i<ctx.grouped_articles.length;i++){
      if (occurrences(ctx.grouped_articles[i].title_content,ctx.input)>maxi){
        maxi = occurrences(ctx.grouped_articles[i].title_content,ctx.input);
      }
    }

    graphEl.selectAll("path.node")
      .data(ctx.grouped_articles)
      .enter()
      .append("rect")
      .attr("y", 0)
      .attr("x", 0)
      .attr("transform", (d) => (`translate(${(parseInt(d.id)-ctx.START-1)*wdt},600)`))
      .attr("width", wdt)
      .attr("height", (d) => (occurrences(d.title_content,ctx.input))/maxi*100)
      .attr("fill", "#c7af36")
      .attr("opacity", 0.8)
      .on('mouseover', function (d, i) {      
        d3.select(this).transition()
             .duration('5')
             .attr('opacity', '1')
             .attr('width', wdt+10)
             .attr('x', -5);})
      .on('mouseout', function (d, i) {
        d3.select(this).transition()
             .duration('5')
             .attr('opacity', '0.8')
             .attr('width', wdt)
             .attr('x', 0);})
      .on("click",
            (event,d) => {image_disapear();image_animation(d),ctx.SELECTED_DATE = d.date;})
      //.on("mouseout",
      //      (event,d) => {image_disapear();})      
      .append("svg:title")
        .text((d) => (`${d.date} \n${occurrences(d.title_content,ctx.input)} occurences of ${ctx.input} `));

      densityPlot(ctx.indiv_articles.filter((d)=> (d.title+d.description).includes(ctx.input)), "#graph");

  }
  //setting time scale
  var parseTime = d3.timeParse("%Y-%m-%d");
  var dates = [];

  dates.push(parseTime(ctx.START_DATE));
  dates.push(parseTime(ctx.END_DATE));

  let timescale = d3.scaleTime()
    .domain(dates) 
    .range([0,ctx.w]);
  
  graphEl.append("g")
  .attr("transform", "translate(65,0)")
  .call(d3.axisTop(timescale).ticks(12).tickFormat(d3.timeFormat("%b %Y")))
  .attr("transform", "translate(0,600)")
  .selectAll("text")
  .style("text-anchor", "center");

  
};

function occurrences(string, subString, allowOverlapping) { //found on stackoverflow https://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string

  string += "";
  subString += "";
  if (subString.length <= 0) return (string.length + 1);

  var n = 0,
      pos = 0,
      step = allowOverlapping ? 1 : subString.length;

  while (true) {
      pos = string.indexOf(subString, pos);
      if (pos >= 0) {
          ++n;
          pos += step;
      } else break;
  }
  return n;
}

function get_date_from_id(id){
    for (let i =0; i< ctx.grouped_articles.length; i++){
      if (ctx.grouped_articles[i].id == id){
        return ctx.grouped_articles[i].date;
      }
    }
    return "0000-00-00"
}

function get_id_from_date(date){
  for (let i = 0; i < ctx.grouped_articles.length; i++){
    if (ctx.grouped_articles[i].date == date){
      return ctx.grouped_articles[i].id;
    }
  }
  return 0
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
};

var bannedwords = ['','<span',';','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','de', 'la', 'a', 'le', 'les', 'des', 'et', 'en', 'du', 'un', 'une', 'dans', 'au', 'pour', 'l', 'sur', 'par', 'qui', 'd', 'est', 'son', 'que', 'monde', 'se', 'plus', 'aux', 'ont', 'avec', 'sa', 'pas', 'ete', 'ses', 'il', 'sont', '.', 'ce', 'contre', 'ne', 'apres', 'ans', 'ou', 'deux', 'leur', 'mais', "d'une", 'entre', "d'un", 'fait', 'cette', 'depuis', 'premier', 'tribune', 'comme', 'face', 'sans', 'leurs', 'etre', 'dont', 'faire', 'ces', 's', 'avait', 'premiere', 'elle', 'nouveau', "s'est", 'annonce', 'selon', 'fin', '%', 'tour', 'trois', 'lors', 'nouvelle', 'tout', ':', 'sous', 'avoir', 'plusieurs', 'avant', 'nous', 
                  'moins', '000', 'tres', 'aussi', 'mois', 'personnes', 'o', '19', 'on', 'notamment', 'y', 'c', 'doit', 'encore', 'etait', 'annees', "qu'il", 'n', 'jeudi', 'comment', '?', '1', 'mercredi', 'dimanche', 'alors', 'fois', 'cinq', 'ils', '2', 'lundi', 'va', 'semaine', 'vendredi', 'si', 'lui', 'pres', 'toujours', 'grande', 'bien', 'chez', '5', 'quatre', 'veut', 'vous', 'deja', 'meme', 'janvier', 'mardi', 'mis', 'ans.', 'tous',
                  'jours', 'notre', 'vers', 'estime', 'devant', 'the', 'peut', 'septembre', 'qu', 'juin', 'second', 'cas', 'non', 'samedi', 'peu', 'mise', 'nos', 'explique', '3', "n'a", 'pourrait', 'demande', 'reste','cet',
                  'desormais','france',"avril","mai","decembre","propose",'octobre','novembre', 'sera', 'je', 'dix', 'juillet', 'deuxieme', 'nouvelles', 'quand', 'certains', 'pendant', 'mesures','fevrier'];

function mode(content)
{
    array = content.split(" ");
    if(array.length == 0)
        return null;
    var modeMap = {};
    var maxEl = array[0], maxCount = 1;
    for(var i = 0; i < array.length; i++)
    {
        var el = array[i];
        if(modeMap[el] == null)
            modeMap[el] = 1;
        else
            modeMap[el]++;  
        if(modeMap[el] > maxCount)
        {
            maxEl = el;
            maxCount = modeMap[el];
        }
    }
    couples=[];
    let keys = Object.keys(modeMap);
    for (let i = 0+1; i<keys.length; i++){
      couples.push([modeMap[keys[i]], keys[i]]);
    }
    sorted_couples = couples.sort(function(a, b){return b[0] - a[0]});
    output=[];
    for (let i = 0+1; i<sorted_couples.length; i++){
      if (!(bannedwords.includes(sorted_couples[i][1]))){
        output.push(sorted_couples[i][1])
      }
      if (output.length>11) break;
    }
    return output;
}

function load_logo(){
  graphEl.append("image")
    .attr("xlink:href", "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Le_Monde.svg/2560px-Le_Monde.svg.png")
    .attr("width", 250)
    .attr("height", 100)
    .attr("transform", "translate(380,225)")
    .on("click",
    () => {image_disapear();image_animation(ctx.grouped_articles[get_id_from_date(ctx.SELECTED_DATE)-1])});

}

function image_disapear(){
  let billboards = graphEl.selectAll("#stockimg");

  billboards
  .transition(d3.transition()
  .duration(200)
  .ease(d3.easeCubic))
  .attr('opacity',0)
  .remove();

  graphEl.selectAll("#dt")
  .transition(d3.transition()
  .duration(800)
  .ease(d3.easeCubic))
  .attr('opacity',0)
  .remove();
}

function image_animation(data){
    imgpaths = data.imagepaths;
    links = data.links;
    date = data.date;
    titles = data.titles;
    descs = data.descriptions;
    cats = data.categorys;

    let n = imgpaths.length;
    rd = getRandomInt(n);
    for (let i = 0; i<9; i++){
      for (let j = 0; j<6; j++){
          if (i>=3 && i<=5 && j>=2 && j<=3){continue;}
          let r = (rd+7*i+j)%n;
          if (imgpaths[r].length>10){
            graphEl.append("image")
            .attr("id", "stockimg")
            .attr("opacity", 0)
            .attr("xlink:href", imgpaths[r])
            .attr("cat", cats[(r+1)%n])
            .attr("width", 100)
            .attr("height", 75)
            .attr("transform", `translate(${30+105*i},${60+72*j})`)
            .on('mouseover', function (d, i) {      //from https://medium.com/@kj_schmidt/show-data-on-mouse-over-with-d3-js-3bf598ff8fc2
              d3.select(this).transition()
                   .duration('50')
                   .attr('width', 110)
                   .attr("x", -5);
              graphEl.append("text")
              .text(function(){let tt = titles[(r+1)%n];
                                if (tt.length>100){
                                  return tt.substring(0,100)+"...";
                                }
                                else{
                                  return tt;
                                }})
              .attr("id", "articletitle")
              .style("fill", "black")
              .style("font", "22px times")
              .style("text-anchor", "middle")
              .attr("transform", "translate(500,520)")
              .attr("opacity", 0)
              .transition(d3.transition()
                      .duration(100)
                      .ease(d3.easeCubic))
              .attr("opacity", 1);})
            .on('mouseout', function (d, i) {
              d3.select(this).transition()
                   .duration('50')
                   .attr("width", d => 100)
                   .attr("x", 0);
                   graphEl.selectAll("#articletitle")
                   .transition(d3.transition()
                           .duration(100)
                           .ease(d3.easeCubic))
                   .attr("opacity", 0)
                   .remove();})
            .on("click", (event,d) => {window.open(links[(r+1)%n]);})
            .transition(d3.transition()
              .duration((4+getRandomInt(3))*400)
              .ease(d3.easeCubic))
            .attr("opacity", d => { if (ctx.input == "*"){
                                      return 1;}
                                    else{
                                      if ((titles[(r+1)%n]+descs[(r+1)%n]).includes(ctx.input)){
                                        return 1;}
                                      else{
                                        return 0.2;
                                      }
                                    }
                                  });
          }
      };
    };

    graphEl.append("text")
      .text(date)
      .attr("id", "dt")
      .style("fill", "black")
      .style("font", "22px times")
      .attr("transform", "translate(450,338)")
      .attr("opacity", 0)
      .transition(d3.transition()
              .duration(800)
              .ease(d3.easeCubic))
      .attr("opacity", 1);
    
    plot_categorys(data);

    daygraphEl.append("text")
        .text("Tendances")
        .attr("id", "frame")
        .style("fill", "black")
        .style("font", "28px times")
        .style("font-family", "Arial Black")
        .style("font-weight", 5000)
        .style("text-anchor", "middle")
        .attr("transform", "translate(500,700)")
        .attr("opacity", 0)
        .transition(d3.transition()
                .duration(100)
                .ease(d3.easeCubic))
        .attr("opacity", 1);
    
    top12 = mode(data.title_content);

    function show_common_words(top){
      
      daygraphEl.selectAll("#trends")
        .transition(d3.transition()
        .duration(200)
        .ease(d3.easeCubic))
        .attr("opacity", 0)
        .remove();

      for (let i = 0; i< top.length; i++){
        

        daygraphEl.append("text")
        .text(top[i])
        .attr("id", "trends")
        .style("fill", "black")
        .style("font", "28px times")
        .style("font-family", "calibri")
        .style("text-anchor", d =>{ if (i<6) return "end";
                                          else return "start";})
        .attr("transform", `translate(${440+(i-i%6)*20},${810+(i%6)*35})`)
        .attr("opacity", 0)
        .on('mouseover', function (d, i) {      
          d3.select(this).transition()
               .duration('50')
               .style("font", "30px times");})
        .on('mouseout', function (d, i) {      
        d3.select(this).transition()
              .duration('50')
              .style("font", "28px times");})
        .on("click", (d,j) => {ctx.input = top[i];
                                plotdata();})
        .transition(d3.transition()
                .duration(800)
                .ease(d3.easeCubic))
        .attr("opacity", d => (1-0.04*i));
      }
    }
    show_common_words(top12);
};

function plot_categorys(data){
  let categorys = data.categorys;
  
  let catstr = categorys.toString();
  let n = data.amount;
  let international = occurrences(catstr,"international")+occurrences(catstr,"afrique");
  let politique = occurrences(catstr,"politique");
  let societe = occurrences(catstr,"societe")+occurrences(catstr,"m-le-mag");
  let sport = occurrences(catstr,"sport")+occurrences(catstr,"football");
  let planete = occurrences(catstr,"planete");
  let sciences = occurrences(catstr,"sciences")+ occurrences(catstr,"sante");
  let economie = occurrences(catstr,"economie")+occurrences(catstr,"emploi");
  let culture = occurrences(catstr,"culture")+occurrences(catstr,"livres")+occurrences(catstr,"cinema")+occurrences(catstr,"pixels");
  let idees = occurrences(catstr,"idees")+occurrences(catstr,"m-voyage");
  let autre = n - (idees + culture + economie + sciences + planete + sport + societe + politique + international);
  
  daygraphEl.append("g");

  function addblock(name,color,amount,total,displace){
    let el = daygraphEl.append("rect")
    .attr("class", "categorys")
    .attr("id", name)
    .attr("height", 0)
    .attr("width", amount/total*900)
    .attr("fill", color)
    .attr("transform", `translate(${50+displace/total*900},720)`)
    .on('mouseover', function (d, i) {
      d3.select(this).transition()
           .duration('50')
           .attr('opacity', '.8');

      daygraphEl.append("text")
           .text(name)
           .attr("id", "catname")
           .style("fill", "black")
           .style("font", "22px times")
           .style("text-anchor", "middle")
           .attr("transform", "translate(500,780)")
           .attr("opacity", 0)
           .transition(d3.transition()
                   .duration(100)
                   .ease(d3.easeCubic))
           .attr("opacity", 1);})

    .on('mouseout', function (d, i) {
      d3.select(this).transition()
           .duration('50')
           .attr("opacity", 1);
          
           daygraphEl.selectAll("#catname")
           .transition(d3.transition()
                   .duration(100)
                   .ease(d3.easeCubic))
           .attr("opacity", 0)
           .remove();})
    .on("click", function(d,i){
      graphEl.selectAll("#stockimg")
      .attr("opacity",  (function(d,i){
                              if (d3.select(this).attr("cat") == name.toLowerCase()){
                                return 1;
                              }
                              else{
                                return 0.3;
                              }
                                }));
    })

    .transition(d3.transition()
      .duration(400)
      .ease(d3.easeCubic))
    .attr("height", 35)

  };
  daygraphEl.selectAll(".categorys")
  .transition(d3.transition()
      .duration(400)
      .ease(d3.easeCubic))
  .attr("height", 0)
  .remove();

  addblock("International","#85aff2",international,n,0);
  addblock("Politique","#d69c9c",politique,n,international);
  addblock("Societe","#bac973",societe,n,international+politique);
  addblock("Sport","#dbb979",sport,n,international+politique+societe);
  addblock("Planete","#83d698",planete,n,international+politique+societe+sport);
  addblock("Sciences","#777cba",sciences,n,international+politique+societe+sport+planete);
  addblock("Economie","#76b59e",economie,n,international+politique+societe+sport+planete+sciences);
  addblock("Culture","#a07dad",culture,n,international+politique+societe+sport+planete+sciences+economie);
  addblock("Idees","#d991bc",idees,n,international+politique+societe+sport+planete+sciences+economie+culture);
  addblock("Autre","#adadad",autre,n,international+politique+societe+sport+planete+sciences+economie+culture+idees);
}

function formatdata(articles){
  // creating a dict in ctx.grouped_articles for every day; containing title words
  let currentdate = articles[0].date;
  let tcontent = "";
  let counter = 0;
  let ttls = [];
  let imgpaths = [];
  let lks = [];
  let descs = [];
  let cats = []
  
  for (let i = 0; i<articles.length; i++){

    
      if (articles[i].date == currentdate){
          tcontent = tcontent.concat(articles[i].title + articles[i].description);
          imgpaths.push("https://"+articles[i].img);
          lks.push("https://"+articles[i].hyperlink);
          ttls.push(articles[i].title);
          descs.push(articles[i].description);
          let cat = articles[i].category;
          switch(cat){
            case "international":
              cat = "international";
              break;
            case "afrique":
              cat = "international";
              break;
            case "politique":
              cat = "politique";
              break;
            case "societe":
              cat = "societe";
              break;
            case "m-le-mag":
              cat = "societe";
              break;
            case "sport":
              cat = "sport";
              break;
            case "football":
              cat = "sport";
              break;
            case "planete":
              cat = "planete";
              break;
            case "sciences":
              cat = "sciences";
              break;
            case "sante":
              cat = "sciences";
              break;
            case "economie":
              cat = "economie";
              break;
            case "emploi":
              cat = "economie";
              break;
            case "culture":
              cat = "culture";
              break;
            case "livres":
              cat = "culture";
              break;
            case "cinema":
              cat = "culture";
              break;
            case "pixels":
              cat = "culture";
              break;
            case "idees":
              cat = "idees";
              break;
            case "m-voyage":
              cat = "idees";
              break;

            default:
              cat = "autre"
          }
          cats.push(cat);
          counter +=1;
      }

      else{
          ctx.grouped_articles.push(
              {date: currentdate,
              id: articles[i-1].day_id-3169,
              amount: counter,
              title_content: tcontent,
              titles: ttls,
              descriptions: descs,
              imagepaths: imgpaths,
              links: lks,
              categorys: cats,
              }
          );
          //reseting tcontent when date changes
          currentdate = articles[i].date;
          tcontent = "";
          counter = 0;
          imgpaths = [];
          lks = [];
          ttls = [];
          descs= [];
          cats = [];
      }      

      ctx.indiv_articles.push({
        date: currentdate,
        id: articles[i].day_id,
        article_id: i,
        title: articles[i].title,
        description: articles[i].decription,
        link:"https://"+articles[i].hyperlink,
        category: articles[i].category
      })
  }
}

function loadData(svgEl){
    let promises = [d3.csv("lemonde_dataset.csv")];
    Promise.all(promises).then(function(data){
        formatdata(data[0]);
        plotdata();
    }).catch(function(error){console.log(error)});

};

function createViz(){
    console.log("Using D3 v"+d3.version);
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    graphEl = svgEl.append("g").attr("id", "graph");  // group for ploting words
    daygraphEl = svgEl.append("g").attr("id", "daygraph");
    loadData(svgEl);
};

function kernelDensityEstimator(kernel, X) {
  return function(V) {
    return X.map(function(x) {
      return [x, d3.mean(V, function(v) { return kernel(x - v); })];
    });
  };
}

function kernelEpanechnikov(k) {
  return function(v) {
    return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
  };
}
