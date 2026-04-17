from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import os
import base64
from sklearn.ensemble import RandomForestClassifier
import pandas as pd
import datetime

app = Flask(__name__)
CORS(app)

@app.route("/predict_attendance", methods=["POST"])
def predict_attendance():
    data = request.get_json()
    attendance_records = data.get("attendance", [])
    students = data.get("students", [])

    if not attendance_records or not students:
        return jsonify({"message": "Insufficient data for prediction"}), 400

    df_logs = pd.DataFrame(attendance_records)
    student_stats = []

    # Calculate system totals and day-of-week data
    if not df_logs.empty and 'recognizedAt' in df_logs.columns:
        df_logs['date'] = pd.to_datetime(df_logs['recognizedAt']).dt.date
        df_logs['day_of_week'] = pd.to_datetime(df_logs['recognizedAt']).dt.dayofweek
        total_system_days = df_logs['date'].nunique()
    else:
        total_system_days = 1

    # Figure out what day tomorrow is (0=Monday, 6=Sunday)
    tomorrow = datetime.datetime.now() + datetime.timedelta(days=1)
    tomorrow_day_of_week = tomorrow.weekday()

    # 1. Feature Engineering
    for student in students:
        enrollmentno = student.get("enrollmentno")
        
        if not df_logs.empty and 'enrollmentno' in df_logs.columns:
            student_logs = df_logs[df_logs['enrollmentno'] == enrollmentno]
            attended_days = student_logs['date'].nunique()
            
            # NEW FEATURE: How often does this student attend on tomorrow's specific day?
            if not student_logs.empty and 'day_of_week' in student_logs.columns:
                specific_day_attended = student_logs[student_logs['day_of_week'] == tomorrow_day_of_week]['date'].nunique()
                total_specific_days = df_logs[df_logs['day_of_week'] == tomorrow_day_of_week]['date'].nunique()
                day_specific_rate = specific_day_attended / total_specific_days if total_specific_days > 0 else 0
            else:
                day_specific_rate = 0
        else:
            attended_days = 0
            day_specific_rate = 0
            
        attendance_rate = attended_days / total_system_days if total_system_days > 0 else 0
        
        student_stats.append({
            "enrollmentno": enrollmentno,
            "name": student.get("name"),
            "total_days": total_system_days,
            "attended_days": attended_days,
            "attendance_rate": attendance_rate,
            "day_specific_rate": day_specific_rate, # Added to ML features
            "label": 1 if attendance_rate > 0.5 else 0 
        })

    df_ml = pd.DataFrame(student_stats)

    # 2. Train Random Forest Model
    # X now includes our new specific day tracking feature
    X = df_ml[['total_days', 'attended_days', 'attendance_rate', 'day_specific_rate']]
    y = df_ml['label']

    if len(y.unique()) > 1:
        # Initialize Random Forest with 100 decision trees
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X, y)
        
        probabilities = model.predict_proba(X)[:, 1] 
    else:
        # Fallback if the database is too new
        probabilities = df_ml['attendance_rate'].values

    # 3. Format Response
    predictions = []
    for i, row in df_ml.iterrows():
        prob_score = round(probabilities[i] * 100, 1)
        predictions.append({
            "name": row['name'],
            "enrollmentno": row['enrollmentno'],
            "probability": prob_score,
            "status": "High Likelihood" if prob_score >= 75 else ("At Risk" if prob_score < 50 else "Moderate")
        })

    # Sort so "At Risk" students show up at the top of the chart
    predictions = sorted(predictions, key=lambda x: x['probability'])

    return jsonify(predictions)


# Store student data (enrollmentno and image path only)#
student_data = {}

# Enroll a new student (enrollmentno, face image)
@app.route("/enroll", methods=["POST"])
def enroll():
    data = request.get_json()
    enrollmentno = data["enrollmentno"]
    image_data = data["image"].split(",")[1]
    image_bytes = base64.b64decode(image_data)
    np_arr = np.frombuffer(image_bytes, np.uint8)
    face_img = cv2.imdecode(np_arr, cv2.IMREAD_GRAYSCALE)

    # Save face image in folder (name the folder by student enrollmentno)
    student_folder = os.path.join("faces", enrollmentno)
    os.makedirs(student_folder, exist_ok=True)

    # Save image as a file in the student's folder
    img_count = len(os.listdir(student_folder))
    img_name = f"{img_count + 1}.jpg"
    img_path = os.path.join(student_folder, img_name)
    cv2.imwrite(img_path, face_img)

    # Store student enrollmentno and image path in the student_data dictionary
    student_data[enrollmentno] = {
        "image_path": img_path
    }

    return jsonify({"message": f"Student {enrollmentno} enrolled successfully!"})

# Train the model
def train_model():
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    faces = []
    labels = []
    label_map = {}
    current_label = 0

    # Loop through all subfolders in 'faces' and add student data
    for person_enrollmentno in os.listdir("faces"):
        person_folder = os.path.join("faces", person_enrollmentno)
        if not os.path.isdir(person_folder):
            continue

        if person_enrollmentno not in label_map:
            label_map[person_enrollmentno] = current_label
            current_label += 1

        for img_file in os.listdir(person_folder):
            img_path = os.path.join(person_folder, img_file)
            img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)

            if img is None:
                print(f"[WARN] Could not read image: {img_path}")
                continue

            faces.append(img)
            labels.append(label_map[person_enrollmentno])

    if len(faces) == 0:
        raise ValueError("No face images found for training.")

    recognizer.train(faces, np.array(labels))
    return recognizer, {v: k for k, v in label_map.items()}

# Face recognition API
@app.route("/recognize", methods=["POST"])
def recognize():
    data = request.get_json()
    image_data = data["image"].split(",")[1]
    image_bytes = base64.b64decode(image_data)
    np_arr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    recognizer, label_reverse_map = train_model()
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    for (x, y, w, h) in faces:
        face_img = gray[y:y+h, x:x+w]
        label, confidence = recognizer.predict(face_img)
        enrollmentno = label_reverse_map.get(label, "Unknown")

        return jsonify({
            "enrollmentno": enrollmentno,
            "confidence": int(confidence)
        })

    return jsonify({"enrollmentno": "No face detected"})

if __name__ == "__main__":
    app.run(port=5000)
