import urllib
import urllib.request
from datetime import date, timedelta
import xlsxwriter
import time as ti
import csv


page = urllib.request.urlopen('https://www.lemonde.fr/archives-du-monde/')

content = (page.read())



## format accents

def formataccents(s):
    """
    s = s.replace('\\xc3\\xa9','é')
    s = s.replace('\\xe2\\x80\\x99',"'")
    s = s.replace('\\xc3\\xa0',"à")
    s = s.replace('\\xc3\\xa2','â')
    s = s.replace('\\xc3\\xa8','è')
    s = s.replace('\\xc3\\xaa','ê')
    s = s.replace('\\xc3\\xab','ë')
    s = s.replace('\\xc2\\xab','«')
    s = s.replace('\\xc2\\xbb','»')
    s = s.replace('\\xc2\\xa0',' ')
    s = s.replace('\\xc3\\xa7','ç')
    s = s.replace('\\xc3\\xae','î')
    s = s.replace('\\xc3\\xaf','ï')
    s = s.replace('\\xc3\\xb4','ô')
    s = s.replace('\\xc5\\x93','oe')
    s = s.replace('\\xc3\\xbb','û')
    s = s.replace('\\xe2\\x80\\xa6','...')
    """
    s = s.replace('\\xc3\\xa9','e')
    s = s.replace('\\xe2\\x80\\x99',"'")
    s = s.replace('\\xc3\\xa0',"a")
    s = s.replace('\\xc3\\xa2','a')
    s = s.replace('\\xc3\\xa8','e')
    s = s.replace('\\xc3\\xaa','e')
    s = s.replace('\\xc3\\xab','e')
    s = s.replace('\\xc2\\xab',' ')
    s = s.replace('\\xc2\\xbb',' ')
    s = s.replace('\\xc2\\xa0',' ')
    s = s.replace('\\xc3\\xa7','c')
    s = s.replace('\\xc3\\xae','i')
    s = s.replace('\\xc3\\xaf','i')
    s = s.replace('\\xc3\\xb4','o')
    s = s.replace('\\xc5\\x93','oe')
    s = s.replace('\\xc3\\xbb','u')
    s = s.replace('\\xe2\\x80\\xa6','...')
    s = s.replace(',',' ')


    for i in range(len(s)):
        if s[i] == '\\':
            s = s.replace(s[i:i+4],'****')
    s = s.replace('*','')
    s = s.replace('</p>','')
    return s.lower()
    # to be completed

def authorformater(s):          #just trying stufff until it works
    s= s.replace('meta__author--page">','°')
    out=""
    deleting = False
    for x in s:
        if not deleting:
            out += x
        if x =='<':
            deleting = True
        if x =='°':
            deleting = False

    s = out
    out=""
    deleting = False

    for x in s:
        if not deleting:
            out += x
        if x =='<':
            deleting = True
        if deleting and x == " ":
            deleting = False

    out = out.replace('<','; ')
    out = out.replace("' ",' ')
    return out




## next level : get all article titles

workbook = xlsxwriter.Workbook('C:/Users/hugob/Desktop/lemonde.xlsx')
worksheet = workbook.add_worksheet()

#init csv
csvfile = open('C:/Users/hugob/Desktop/lemonde_dataset_22y.csv', "a+")
csv_reader = csv.reader(csvfile)
csv_writer = csv.DictWriter(csvfile, fieldnames=('day_id','date','hyperlink','title','author','description','img','category'),lineterminator = '\n')
csv_writer.writeheader()


lastline = 2

link_init = False
desc_init = False
pict_init = False
author_init = False

titles = []
links = []
descriptions  =[]
pictures = []
authors = []

t = ti.time()

def daterange(start_date, end_date):
    for n in range(int((end_date - start_date).days)):
        yield start_date + timedelta(n)

start_date = date(2017, 9, 26)
end_date = date(2022, 12, 16)


day_id = 2095

for day in daterange(start_date, end_date):
    day_id += 1
    ti.sleep(0.5)
    nb=0
    Lt=[]       #get titles
    Ll=[]       #get links
    Ld=[]       #get descriptions
    Lp=[]       #get picture urls
    La=[]       #get authors
    i=1         #increment for page number of given day
    # print('https://www.lemonde.fr/archives-du-monde/{}/'.format(day.strftime("%d-%m-%Y")))
    try:
        page = urllib.request.urlopen('https://www.lemonde.fr/archives-du-monde/{}/'.format(day.strftime("%d-%m-%Y")))
    except:
        print('bruh')
    else:
        content = (page.read())
        scontent = content.split()


        for x in range(len(scontent)):

            if link_init:
                Lt.append(" ".join(str(scontent[x])[2:].split('_')[0].split('/')[-1].split('-')))
                Ll.append(str(scontent[x])[8:-3])
                link_init = False

            if desc_init:
                Ld[-1] += (str(scontent[x])[2:-1])+" "
                if '</p>' in str(scontent[x]):
                    Ld[-1] = formataccents(Ld[-1])
                    desc_init = False

            if pict_init and 'data-src=' in str(scontent[x]):
                Lp[-1] += (str(scontent[x])[12:-2])
                pict_init = False

            if author_init:
                if '</p>' in str(scontent[x]):
                    author_init = False
                else:
                    La[-1] += str(scontent[x])[2:]+ " "

            if 'meta__author--page">' in str(scontent[x]) and len(La):
                La[-1] += str(scontent[x])[22:]+" "
                author_init = True

            if "teaser__picture" in str(scontent[x]) and len(Lp):
                pict_init = True

            if "teaser__desc" in str(scontent[x]):
                desc_init = True

            if "teaser__link" in str(scontent[x]):
                link_init = True
                Ld.append("")
                Lp.append("")
                La.append("")

                nb+=1


    while nb==40 and nb>0:
        i+=1
        nb=0

        try:
            page = urllib.request.urlopen('https://www.lemonde.fr/archives-du-monde/{}/{}/'.format(day.strftime("%d-%m-%Y"),i))
        except:
            print('bruh')
        else:
            content = (page.read())
            scontent = content.split()

            for x in range(len(scontent)):
                if link_init:
                    Lt.append(" ".join(str(scontent[x])[2:].split('_')[0].split('/')[-1].split('-')))
                    Ll.append(str(scontent[x])[8:-3])
                    link_init = False

                if desc_init:
                    Ld[-1] += (str(scontent[x])[2:-1])+" "
                    if '</p>' in str(scontent[x]):
                        Ld[-1] = formataccents(Ld[-1])
                        desc_init = False

                if pict_init and 'data-src=' in str(scontent[x]):
                    Lp[-1] += (str(scontent[x])[12:-2])
                    pict_init = False

                if author_init:
                    if '</p>' in str(scontent[x]):
                        author_init = False
                    else:
                        La[-1] += str(scontent[x])[2:]+ " "

                if 'meta__author--page">' in str(scontent[x]) and len(La):
                    La[-1] += str(scontent[x])[22:]+" "
                    author_init = True

                if "teaser__picture" in str(scontent[x]) and len(Lp):
                    pict_init = True

                if "teaser__desc" in str(scontent[x]):
                    desc_init = True

                if "teaser__link" in str(scontent[x]):
                    link_init = True
                    Ld.append("")
                    Lp.append("")
                    La.append("")

                    nb+=1

    for x in range(len(Lt)):
        Llsplit=Ll[x][8:].split('/')
        if len(Llsplit)>1:
            cat = Ll[x][8:].split('/')[1]
        else:
            cat = "autre"
        csv_writer.writerow({'day_id': day_id,
                            'date': day.strftime("%Y-%m-%d"),
                            'hyperlink' : Ll[x][8:],
                            'title' : Lt[x],
                            'author' : formataccents(authorformater(La[x])),
                            'description' : Ld[x],
                            'img': Lp[x][8:],
                            'category': cat})
        """"
        worksheet.write('A{}'.format(x+lastline), day.strftime("%d-%m-%Y"))
        worksheet.write('B{}'.format(x+lastline), Ll[x][8:])    #avoiding url limit
        worksheet.write('C{}'.format(x+lastline), Lt[x])
        worksheet.write('D{}'.format(x+lastline), formataccents(authorformater(La[x])))
        worksheet.write('E{}'.format(x+lastline), Ld[x])
        worksheet.write('F{}'.format(x+lastline), Lp[x][8:])   #avoiding url limit
        """
    lastline+=(len(Lt))
    titles.append(Lt)
    links.append(Ll)
    descriptions.append(Ld)
    print(len(Lt))

csvfile.close()
workbook.close()
print(ti.time()-t)

##
import matplotlib.pyplot as plt

Y = [len(L) for L in titles]
Y2 = [sum(Y[i:i+7])/7 for i in range(len(Y)-7)]

plt.plot(Y2,'b')
plt.show()

##


for x in range(len(scontent)):
    print(scontent[x])
    if "teaser__link" in str(scontent[x]):
        for y in range(x,x+120):
            print(scontent[y])
        print(x)
        break


"""
teaser__link for link to article (which contains title
teaser__desc for description
meta__author--page"> possibly for author
teaser__picture + <source' for picture
"""


##
import xlsxwriter

workbook = xlsxwriter.Workbook('C:/Users/hugob/Desktop/new.xlsx')

worksheet = workbook.add_worksheet()

for i in range(len(Lt)):
    worksheet.write('C{}'.format(i+2), Lt[i])
    worksheet.write('D{}'.format(i+2), Ld[i])
    worksheet.write('E{}'.format(i+2), Lp[i])



# Finally, close the Excel file
# via the close() method.
workbook.close()


## word cloud emplacement generator
import numpy as np
import random as rd
import matplotlib.pyplot as plt
##

n=200

L = [int(np.random.normal(loc=100, scale=20)) for i in range(n)]
L.sort()
ratio = [rd.randint(2,5) for i in range(max(L))]


def assignspaces(L,ratio,thresholdfreq = 1):
    n = max(L)
    m = 150
    L.sort()
    freq = [L.count(i) for i in range(n+1)]     #frequencies of "words"
    freq.sort(reverse=True)                     #sorted to treat most important first

    M = np.zeros((m+200,m+200))
    Mbanned = np.zeros((m+200,m+200))
    for i in range(n):

        if freq[i]>=thresholdfreq:     #checking if frequencie is acceptable

            #initializing coodinates, hosen randomly with normal distribution
            sigma = 1

            sizex = freq[i]*ratio[i]
            sizey = freq[i]

            x=np.random.normal(loc=m/2, scale=m/100)
            y=np.random.normal(loc=m/2, scale=m/100)
            x = int(max(0,min(m-1,x)))+100
            y = int(max(0,min(m-1,y)))+100

            while np.max(Mbanned[y-sizey:y+sizey,x-sizex:x+sizex]) != 0:    #repeat while overlapps to much with other words
                x=np.random.normal(loc=m/2, scale=m/100*sigma)
                y=np.random.normal(loc=m/2, scale=m/100*sigma)
                x = int(max(0,min(m-1,x)))+100
                y = int(max(0,min(m-1,y)))+100
                sigma += 1
                if sigma > 25000:   #breaking if taking to long
                    break

            if sigma < 25000:       #if not breaked

                #upddating matrixes
                M[y-sizey:y+sizey,x-sizex:x+sizex] = freq[i]
                Mbanned[y-sizey//5*4:y+sizey//5*4,x-sizex//5*4:x+sizex//5*4] = freq[i]


    #framing
    a,b,c,d = 0,0,0,0
    for i in range(m+200):
        if sum(M[i]) > 0:
            a = i
            break
    for i in range(m+200):
        if sum(M[-i]) >0:
            b = i
            break
    for i in range(m+200):
        if sum(M[:,i]) >0:
            c = i
            break
    for i in range(m+200):
        if sum(M[:,-i]) >0:
            d = i
            break

    return M[a-10:-b+10,c-10:-d+10]

M = assignspaces(L,ratio)
plt.matshow(M,cmap=plt.cm.cividis)
plt.show()




"""
problems:
if not tweaked correctly, eliminates important words because of lack of space
may crash if buffer on sides is not big enough
can be a bit slow
not quite adaptatif yet to larger word samples
"""










