# Object Detector
An object detection project implemented in Python, leveraging the powerful capabilities of the TensorFlow Object Detection API. Designed to detect objects within images and live video streams from webcams.

## Usage

1. Clone the repository

   - `git clone https://github.com/alexislayvu/ObjectDetector.git`

2. Go into the directory

   - `cd ObjectDetector`

3. Create a new virtual environment

   - `python -m venv tfod`

4. Activate the virtual environment

   - Linux/MacOS: `source tfod/bin/activate`
   - Windows: `.\tfod\Scripts\activate`

5. Install dependencies and add virtual environment to the Python Kernel
   - `python -m pip install --upgrade pip`
   - `pip install ipykernel`
   - `python -m ipykernel install --user --name=tfod`
   - `pip install notebook`

## Changelog
* [841d4fd](https://github.com/alexislayvu/ObjectDetector/commit/841d4fd610b928c902fa84fc038e863462745558) update model to detect stop signs
* [009a155](https://github.com/alexislayvu/ObjectDetector/commit/009a1551e2850f38c789d582dce88fb98960378c) rename files for consistency
