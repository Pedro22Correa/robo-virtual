import base64,sys,os
def r(p): return open(p,encoding='utf-8').read()
def uri(p,mime): return 'data:%s;base64,%s'%(mime,base64.b64encode(open(p,'rb').read()).decode())
nm='node_modules/blockly/'
sim='/home/claude/work/site/static/sim/'
img=os.path.join(os.path.dirname(os.path.abspath(__file__)),'img')+'/'
logo=uri(sim+'zoom.png','image/png')
def im(n,m): return uri(img+n,m)
arq='window.ROBO_ARQUIVOS={tapete:"%s",robo:"%s",tapeteMatata:"%s",tapeteTale:"%s",tapeteNous:"%s",roboMatata:"%s",roboTale:"%s",roboNous:"%s",logo:"%s"};'%(im('tapete-vincibot.jpg','image/jpeg'),im('robo-vincibot.png','image/png'),im('tapete-matata.jpg','image/jpeg'),im('tapete-tale.jpg','image/jpeg'),im('tapete-nous.jpg','image/jpeg'),im('robo-matata.png','image/png'),im('robo-tale.png','image/png'),im('robo-nous.png','image/png'),logo)
t=r('src/index.template.html')
def js(s): return s.replace('</script','<\\/script')
for k,v in [('/*BLOCKLY*/',r(nm+'blockly_compressed.js')),('/*BLOCKS*/',r(nm+'blocks_compressed.js')),('/*MSG*/',r(nm+'msg/pt-br.js')),('/*ARQUIVOS*/',arq),('/*BLOCOS*/',r('src/blocos.js')),('/*APP*/',r('src/app.js'))]:
    assert t.count(k)==1,k; t=t.replace(k,js(v).replace('//# sourceMappingURL','// map'))
os.makedirs('dist',exist_ok=True); open('dist/index.html','w',encoding='utf-8').write(t); print('dist/index.html',len(t))
