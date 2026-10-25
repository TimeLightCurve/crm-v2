"use client";

import { useEffect, useRef, useState } from "react";
import type { Material, Mesh, Vector3 } from "three";
import type { EnterpriseRecord } from "@/lib/enterprise/domain";

const colors: Record<EnterpriseRecord["kind"], number> = {
  decision: 0x8e70d4, case: 0x5d9f8b, meeting: 0xe9a96c,
  action: 0x70a5c3, knowledge: 0xb49c78, risk: 0xd17680,
};

export default function RelationshipMap({ records, onSelect, locale }: {
  records: EnterpriseRecord[];
  onSelect: (record: EnterpriseRecord) => void;
  locale: "fa" | "en";
}) {
  const host = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    const element = host.current;
    if (!element || records.length === 0) return;
    let disposed = false;
    let cleanup = () => {};
    void (async () => {
      try {
        const THREE = await import("three");
        const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
        if (disposed) return;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf8f6fc);
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(0, 1.8, 10);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        element.appendChild(renderer.domElement);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = false;
        controls.enableDamping = true;
        controls.minDistance = 4;
        controls.maxDistance = 18;
        controls.maxPolarAngle = Math.PI * 0.75;
        const group = new THREE.Group();
        scene.add(group);
        const nodes: Mesh[] = [];
        const positions = new Map<string, Vector3>();
        records.slice(0, 80).forEach((record, index) => {
          const ring = Math.floor(index / 12);
          const angle = (index % 12) * Math.PI * 2 / Math.min(12, records.length - ring * 12);
          const radius = 2.1 + ring * 1.2;
          const point = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(index * 1.7) * 0.65, Math.sin(angle) * radius);
          positions.set(record.id, point);
          const material = new THREE.MeshStandardMaterial({ color: colors[record.kind], roughness: 0.38, metalness: 0.12 });
          const mesh = new THREE.Mesh(new THREE.SphereGeometry(record.kind === "decision" ? 0.22 : 0.16, 16, 12), material);
          mesh.position.copy(point);
          mesh.userData.record = record;
          group.add(mesh);
          nodes.push(mesh);
        });
        for (const record of records.slice(0, 80)) {
          const from = positions.get(record.id);
          if (!from) continue;
          for (const id of record.sourceIds) {
            const to = positions.get(id);
            if (!to) continue;
            group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([from, to]), new THREE.LineBasicMaterial({ color: 0xb4a5cb, transparent: true, opacity: 0.65 })));
          }
        }
        scene.add(new THREE.AmbientLight(0xffffff, 2.2));
        const light = new THREE.DirectionalLight(0xffffff, 2);
        light.position.set(3, 6, 4);
        scene.add(light);
        const resize = () => {
          const width = element.clientWidth;
          const height = element.clientHeight;
          if (!width || !height) return;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
          renderer.render(scene, camera);
        };
        const observer = new ResizeObserver(resize);
        observer.observe(element);
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        const click = (event: MouseEvent) => {
          const rect = renderer.domElement.getBoundingClientRect();
          pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height * 2 - 1));
          raycaster.setFromCamera(pointer, camera);
          const hit = raycaster.intersectObjects(nodes)[0];
          if (hit) onSelect(hit.object.userData.record as EnterpriseRecord);
        };
        renderer.domElement.addEventListener("click", click);
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let frame = 0;
        const animate = () => { controls.update(); renderer.render(scene, camera); frame = requestAnimationFrame(animate); };
        if (!reduced) animate();
        else controls.addEventListener("change", resize);
        resize();
        cleanup = () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          renderer.domElement.removeEventListener("click", click);
          controls.dispose();
          group.traverse((item) => {
            if (item instanceof THREE.Mesh || item instanceof THREE.Line) {
              item.geometry.dispose();
              (item.material as Material).dispose();
            }
          });
          renderer.dispose();
          renderer.domElement.remove();
        };
      } catch { if (!disposed) setAvailable(false); }
    })();
    return () => { disposed = true; cleanup(); };
  }, [records, onSelect]);

  return <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
    <div ref={host} className="min-h-80 overflow-hidden rounded-2xl border border-[#ded7e9] bg-[#f8f6fc]" role="img" aria-label={locale === "fa" ? "نقشه تعاملی روابط رکوردها" : "Interactive record relationship map"}>
      {!available && <p className="p-5 text-sm">{locale === "fa" ? "نمای سه‌بعدی در این مرورگر در دسترس نیست" : "3D view is unavailable in this browser"}</p>}
    </div>
    <div className="max-h-80 overflow-auto rounded-2xl border border-[#ded7e9] bg-white p-3" aria-label={locale === "fa" ? "فهرست دسترس‌پذیر رکوردها" : "Accessible record list"}>
      {records.slice(0, 80).map((record) => <button key={record.id} onClick={() => onSelect(record)} className="block w-full rounded-xl px-3 py-2 text-start text-sm hover:bg-[#eee9f8] focus-visible:outline-2 focus-visible:outline-[#6856a5]">
        <span className="me-2 inline-block size-2 rounded-full" style={{ backgroundColor: `#${colors[record.kind].toString(16)}` }} />{record.title}
      </button>)}
    </div>
  </div>;
}
