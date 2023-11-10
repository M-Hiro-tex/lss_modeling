import numpy as np
import random
from scipy.optimize import fsolve
from vispy import app, scene
from vispy.geometry import MeshData



# 提供されたコードからの関数はそのまま使用


def FindVertex(a, b, c):
    ac = c - a
    ab = b - a
    abxac = np.cross(ab, ac)
    ed = abxac / np.linalg.norm(abxac)
    ag = (ab + ac) / 3

    def equation(x):
        ad = x * ed + ag
        return np.dot(ad, ad) - np.dot(ab, ab)

    x1, = fsolve(equation, 1)
    x2, = fsolve(equation, -1)
    return [a + x1 * ed + ag, a + x2 * ed + ag]

def NearVlist(p,vlistwc,elength):
    for nvk in range(len(vlistwc)):
        if np.linalg.norm(vlistwc[nvk][0] - p) < 0.999*elength:
            return True
    return False

def NearVlistWC(p, c,vlistwc,elength):
    for nvk in range(len(vlistwc)):
        if c == vlistwc[nvk][1]:
            if np.linalg.norm(vlistwc[nvk][0] - p) < np.sqrt(3) * elength:
                return True
    return False

def collect_simulation_data(iterations):
    a = np.array([1, 0, 0])
    b = np.array([0, 1, 0])
    c = np.array([0, 0, 1])
    dlist = FindVertex(a, b, c)
    elength = np.linalg.norm(a - b)
    colornum = set(range(1, 9))
    
    vlistwc = [[a, 1], [b, 2], [c, 3], [dlist[0], 4], [dlist[1], 5]]
    tlistwc = [[[a, 1], [b, 2], [c, 3], [dlist[0], 4]], [[a, 1], [b, 2], [c, 3], [dlist[1], 5]]]
    tlist = [[v[0] for v in tetra] for tetra in tlistwc]

    for _ in range(iterations):
        Tetrawc = random.choice(tlistwc)
        
        for i in range(4):
            trianglewc = [x for j, x in enumerate(Tetrawc) if j != i]
            NewV = (2/3) * np.sum([x[0] for x in trianglewc], axis=0) - Tetrawc[i][0]
            colors = {x[1] for x in trianglewc}
            NewClist = list(colornum - colors)
            NewC = random.choice(NewClist)
            NewTetrawc = trianglewc + [[NewV, NewC]]
            
            if not (NearVlist(NewV, vlistwc, elength) or NearVlistWC(NewV, NewC, vlistwc, elength)):
                vlistwc.append([NewV, NewC])
                tlistwc.append(NewTetrawc)
                tlist.append([v[0] for v in NewTetrawc])

    return vlistwc, tlist

colorset = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'gray', 'black']
vlistwc, tlist = collect_simulation_data(7000)

# Create a canvas with a 3D viewport
canvas = scene.SceneCanvas(keys='interactive', show=True)
view = canvas.central_widget.add_view()

# Plot tetrahedrons
for tetra in tlist:
    vertices = np.array(tetra)
    faces = np.array([[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]])
    meshdata = MeshData(vertices=vertices, faces=faces)
    mesh = scene.visuals.Mesh(meshdata.get_vertices(), faces=meshdata.get_faces(), shading='smooth', parent=view.scene)
    mesh.transform = scene.transforms.MatrixTransform()

# Plot vertices with colors
for v, color in vlistwc:
    sphere = scene.visuals.Sphere(radius=0.05, color=colorset[color-1], parent=view.scene)
    sphere.transform = scene.transforms.MatrixTransform()
    sphere.transform.translate(v)

view.camera = 'turntable'  # or try 'arcball'

# Run the application
app.run()