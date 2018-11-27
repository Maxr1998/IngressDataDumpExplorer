### Como pedir los datos
Mandas un mail a `privacy@nianticlabs.com`:

> Dear Sir or Madam,  
> I'd like to request a dump of the raw data Niantic stores about my Ingress account @<account_name>, as regulated under GDPR.  
> Yours sincerely,  
> <tu_nombre>

### Tutorial para usuarios no experimentados (Windows)

1) Click en el boton verde de arriba a la derecha que dice "Clone or download" y luego en "Download zip"
2) Usando 7zip, winzip o winrar lo deszipeas en el escritorio
3) Entra a la carpeta que deszipeaste, crea una nueva llamada "dump" y entrá en ella
4) Copia la direccion de la carpeta, abro el zip que te envió NIA y pone "Extraer en" y pega en carpeta destino la direccion que copiaste
5) Click en este [link](https://github.com/Maxr1998/IngressDataDumpExplorer/releases/download/1.0.1/app_windows.exe) y lo descargas en la carpeta que creaste en el escritorio
6) Abri el menu de windows escribi cmd y le das enter, se abre la consola
7) Ahora entra a la carpeta dump que creaste y te copias la direccion que aparece en la barra de direcciones como en el paso 4
8) En la consola escribis cd (espacio) y pegas la direccion que copiaste en el paso anterior
10) Copia y pega el siguiente comando en la consola sed -i "s/None\tNone$/None/g" game_log.tsv y ejecutalo apretando enter. Si eso da un error (Windows 7) baja e instala el programa sed desde este [link](https://sourceforge.net/projects/gnuwin32/files//sed/4.2.1/sed-4.2.1-setup.exe/download)

11) Doble click al programa que bajast en el paso 5) app_windows.exe
12) Abri el navegador y pone esto en la barra de direcciones localhost:8080

<img src="example_screen.png" width="960px" />


### License

    IngressDataDumpExplorer, a set of tools to explore your Ingress gamedata
    Copyright (C) 2018  Maxr1998

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
