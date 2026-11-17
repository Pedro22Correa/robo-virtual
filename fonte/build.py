import base64,sys,os
def r(p): return open(p,encoding='utf-8').read()
def uri(p,mime): return 'data:%s;base64,%s'%(mime,base64.b64encode(open(p,'rb').read()).decode())
nm='node_modules/blockly/'
sim='/home/claude/work/site/static/sim/'
arq='window.ROBO_ARQUIVOS={tapete:"%s",robo:"%s",logo:"%s",matata:"%s",nous:"%s",tale:"%s"};'%(uri(sim+'tapete.jpg','image/jpeg'),uri(sim+'robo.png','image/png'),uri(sim+'zoom.png','image/png'),uri('src/robo-matata.png','image/png'),uri('src/robo-nous.png','image/png'),uri('src/robo-tale.png','image/png'))
t=r('src/index.template.html')
def js(s): return s.replace('</script','<\\/script')
for k,v in [('/*BLOCKLY*/',r(nm+'blockly_compressed.js')),('/*BLOCKS*/',r(nm+'blocks_compressed.js')),('/*MSG*/',r(nm+'msg/pt-br.js')),('/*ARQUIVOS*/',arq),('/*BLOCOS*/',r('src/blocos.js')),('/*APP*/',r('src/app.js'))]:
    assert t.count(k)==1,k; t=t.replace(k,js(v).replace('//# sourceMappingURL','// map'))
os.makedirs('dist',exist_ok=True); open('dist/index.html','w',encoding='utf-8').write(t); print('dist/index.html',len(t))
