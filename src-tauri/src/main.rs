// Geen consolevenster op Windows in de release-build.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// S273: projecten, runs en gels als bestanden in Documenten\LabKit\Projecten (één map per project).
// De pagina roept deze opdrachten aan via window.__TAURI__.core.invoke (src/engines/store.js).
// Paden komen altijd relatief binnen die map binnen: alleen letters, cijfers, - _ . en /, zonder
// lege delen, . of .., zodat de pagina nooit buiten de map kan lezen of schrijven.

use std::fs;
use std::path::PathBuf;
use tauri::Manager;

fn root(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let docs = app.path().document_dir().map_err(|e| e.to_string())?;
    Ok(docs.join("LabKit").join("Projecten"))
}

fn rel_path(app: &tauri::AppHandle, rel: &str) -> Result<PathBuf, String> {
    let mut p = root(app)?;
    if rel.is_empty() {
        return Ok(p);
    }
    let ok_chars = rel.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_' || c == '.' || c == '/');
    if !ok_chars || rel.starts_with('/') || rel.split('/').any(|s| s.is_empty() || s == "." || s == "..") {
        return Err(format!("ongeldig pad: {rel}"));
    }
    for part in rel.split('/') {
        p.push(part);
    }
    Ok(p)
}

#[tauri::command]
fn store_dir(app: tauri::AppHandle) -> Result<String, String> {
    Ok(root(&app)?.to_string_lossy().into_owned())
}

#[tauri::command]
fn store_read(app: tauri::AppHandle, rel: String) -> Result<Option<String>, String> {
    let p = rel_path(&app, &rel)?;
    if !p.is_file() {
        return Ok(None);
    }
    fs::read_to_string(&p).map(Some).map_err(|e| e.to_string())
}

/* eerst naar een tijdelijk bestand, dan hernoemen: een half geschreven project bestaat nooit */
#[tauri::command]
fn store_write(app: tauri::AppHandle, rel: String, data: String) -> Result<(), String> {
    let p = rel_path(&app, &rel)?;
    if let Some(dir) = p.parent() {
        fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    }
    let tmp = p.with_extension("tmp");
    fs::write(&tmp, data).map_err(|e| e.to_string())?;
    fs::rename(&tmp, &p).map_err(|e| e.to_string())
}

#[tauri::command]
fn store_delete(app: tauri::AppHandle, rel: String) -> Result<(), String> {
    if rel.is_empty() {
        return Err("de hele map wordt nooit in één keer gewist".into());
    }
    let p = rel_path(&app, &rel)?;
    if p.is_dir() {
        fs::remove_dir_all(&p).map_err(|e| e.to_string())
    } else if p.is_file() {
        fs::remove_file(&p).map_err(|e| e.to_string())
    } else {
        Ok(())
    }
}

/* de namen in een map (bestanden en mappen), zonder tijdelijke bestanden; leeg als de map er niet is */
#[tauri::command]
fn store_list(app: tauri::AppHandle, rel: String) -> Result<Vec<String>, String> {
    let p = rel_path(&app, &rel)?;
    if !p.is_dir() {
        return Ok(vec![]);
    }
    let mut out = vec![];
    for e in fs::read_dir(&p).map_err(|e| e.to_string())? {
        let name = e.map_err(|e| e.to_string())?.file_name().to_string_lossy().into_owned();
        if !name.ends_with(".tmp") {
            out.push(name);
        }
    }
    out.sort();
    Ok(out)
}

/* de gels van een project zonder "snap" (het gelproject zelf, vaak een paar MB): genoeg voor de lijst */
#[tauri::command]
fn gel_index(app: tauri::AppHandle, pid: String) -> Result<Vec<serde_json::Value>, String> {
    let dir = rel_path(&app, &format!("{pid}/gels"))?;
    if !dir.is_dir() {
        return Ok(vec![]);
    }
    let mut out = vec![];
    for e in fs::read_dir(&dir).map_err(|e| e.to_string())? {
        let path = e.map_err(|e| e.to_string())?.path();
        if path.extension().and_then(|x| x.to_str()) != Some("json") {
            continue;
        }
        let Ok(text) = fs::read_to_string(&path) else { continue };
        let Ok(mut v) = serde_json::from_str::<serde_json::Value>(&text) else { continue };
        if let Some(obj) = v.as_object_mut() {
            obj.remove("snap");
        }
        out.push(v);
    }
    Ok(out)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![store_dir, store_read, store_write, store_delete, store_list, gel_index])
        .run(tauri::generate_context!())
        .expect("Labkit BML kon niet starten");
}
