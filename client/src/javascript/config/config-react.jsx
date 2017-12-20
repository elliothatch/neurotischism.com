import TaskDisplay from "./TaskDisplay";
import FileExplorer from "./FileExplorer";
import QRComponent from "./QRcomponent";
import TaskDefinitionDisplay from "./TaskDefinitionDisplay";

import React from 'react';
import ReactDOM from 'react-dom';
/*global io*/
/*global FreshrContext*/

var configSocket = io('/~config');
/*
 * entry:
 *   name{string}
 *   path{string}
 *   type{'file' | 'directory'}
 *   entries{entry[]}
 */
class ConfigComponent extends React.Component {

	handleClickBuild(event) {
		configSocket.emit('build');
	}

	render() {
		return <div>
			<header>
				<h1 className="title">Freshr Configuration</h1>
			</header>
			<div className="page-content">
				<div className="file-explorer-display">
					<FileExplorer entry={this.props.srcDirectory}></FileExplorer>
				</div>
				<div className="ip-display">
					{[{name: 'Local URL', ip: this.props.config.serverLocalIp}, {name: 'Public URL', ip: this.props.config.serverPublicIp}].map(ipObj => {
						var url = ipObj.ip && `${window.location.protocol}${ipObj.ip}://${this.props.config.serverPort}`;
						return <div key={ipObj.name}>
							<span>{ipObj.name}: {ipObj.ip ? url : 'unknown'}</span>
							<QRComponent text={url} />
						</div>;
					})}
				</div>
				<div className="build-display">
					{this.props.taskDefinitions && <TaskDefinitionDisplay taskDefinitions={this.props.taskDefinitions} />}
					<button onClick={this.handleClickBuild}>Build</button>
					{this.props.buildTask && <TaskDisplay task={this.props.buildTask} />}
					{this.props.config.categories.map(category => {
						return <div key={category.name} className="config card collapser-wrapper">
							<h2 className="card-title">{category.name} <button className="collapser"></button></h2>
							<div className="card-body collapser-target">
								<ul className="fields">
									{category.fields.map(field => {
										return <li key={field.name}>{field.name}</li>;
									})}
								</ul>
							</div>
						</div>;
					})}
				</div>
			</div>
		</div>;
	}
}

function getTask(task, taskPath) {
	if(taskPath.length === 0) {
		return task;
	}
	return getTask(task.tasks[taskPath[0]], taskPath.slice(1));
}

var srcDirectory = null;
configSocket.on('files/src', function(srcEntry) {
	console.log('files/src', srcEntry);
	srcDirectory = srcEntry;
	render();
});

var buildTasks = {};

configSocket.on('build/start', function(tasks) {
	console.log('build/start', tasks);
	buildTasks = tasks;
	render();
});
configSocket.on('build/success', function(result) {
	console.log('build/success', result);
});
configSocket.on('build/fail', function(error) {
	console.log('build/fail', error);
});
configSocket.on('build/task/start', function(data) {
	var task = getTask(buildTasks.tasks, data.path);
	task.running = true;
	render();
});
configSocket.on('build/task/log', function(data) {
	var task = getTask(buildTasks.tasks, data.path);
	task.status = data.status;
	if(!task.logs) {
		task.logs = [];
	}
	task.logs.push(data.log);
	render();
});
configSocket.on('build/task/done', function(data) {
	var task = getTask(buildTasks.tasks, data.path);
	task.running = false;
	task.status = data.status;
	render();
});

configSocket.on('publicip', function(ip) {
	FreshrContext.config.serverPublicIp = ip;
	render();
});

var taskDefinitions = {};
configSocket.on('task-definitions', function(tds) {
	console.log(tds);
	taskDefinitions = tds;
	render();
});

//configSocket.emit('build');
configSocket.emit('publicip');
configSocket.emit('files/src');
configSocket.emit('task-definitions');

render();

function render() {
	const element = <ConfigComponent config={FreshrContext.config} taskDefinitions={taskDefinitions} buildTask={buildTasks.tasks} srcDirectory={srcDirectory} />;
	ReactDOM.render(
		element,
		document.getElementById('root')
	);
}


